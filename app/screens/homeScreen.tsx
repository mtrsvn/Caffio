import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getCoffeeLogs } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
import EditLogSheet from "../components/editLogSheet";
import ForYouCard from "../components/forYouCard";
import LogCard, { LogEntry } from "../components/logCard";
import PersonalityCard, { Personality } from "../components/PersonalityCard";
import personalitiesData from "../data/personalities.json";
import shops from "../data/shops.json";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const personality: Personality = React.useMemo(() => {
    const list: Personality[] = personalitiesData as any;
    if (list.length === 0) {
      return { name: "", description: "", tags: [] };
    }
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }, []);

  // useContext infers the type from the AuthContext value
  const { user } = useContext(AuthContext);
  // logs are no longer displayed on home; state removed

  // logs fetched from Firebase; show latest three
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [firstRun, setFirstRun] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [editingEntry, setEditingEntry] = React.useState<LogEntry | null>(null);
  const [editVisible, setEditVisible] = React.useState(false);

  const fetchLogs = React.useCallback(
    async (showSpinner = true) => {
      if (!user) {
        setLogs([]);
        if (showSpinner) setRefreshing(false);
        setFirstRun(false);
        return;
      }
      if (showSpinner) setRefreshing(true);
      try {
        const fetched = (await getCoffeeLogs(user.uid)) as LogEntry[];
        setLogs(fetched.slice(0, 3));
      } catch (err: any) {
        console.error("[HomeScreen] failed to load logs", err);
      } finally {
        if (showSpinner) setRefreshing(false);
        setFirstRun(false);
      }
    },
    [user],
  );

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // prepare For You items (same logic as foryouScreen)
  const items = React.useMemo(() => {
    type Shop = { shop_id: string; name: string; menu: any[] };
    const shopsData: Shop[] = shops as any;
    return shopsData.flatMap((shop) => {
      const flatMenu = Array.isArray(shop.menu)
        ? (shop.menu as any[]).flat(Infinity)
        : [];
      return flatMenu.map((it) => ({ ...it, shopName: shop.name }));
    });
  }, []);

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLogs(true)}
              tintColor={colors.gradientStart}
              colors={[colors.gradientStart]}
            />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: (insets.top ?? 0) * 0.5, // reduced gap above personality card
            paddingBottom: insets.bottom ?? 0,
          }}
        >
          <PersonalityCard personality={personality} />

          {/* sample logs */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Your Coffee Logs</Text>
              <Text style={styles.subtitle}>
                Track and review your coffee experiences
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              {logs.map((entry) => (
                <LogCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => {
                    setEditingEntry(entry);
                    setEditVisible(true);
                  }}
                  onToggleFavorite={(newVal) => {
                    setLogs((prev) =>
                      prev.map((l) =>
                        l.id === entry.id ? { ...l, favorite: newVal } : l,
                      ),
                    );
                  }}
                />
              ))}
              {!user && !firstRun && (
                <Text style={{ color: colors.iconInactive, marginTop: 8 }}>
                  Log in to view your entries
                </Text>
              )}
            </View>
          </View>

          {/* For You recommendations */}
          <View style={[{ marginTop: 12, paddingHorizontal: 16 }]}>
            <Text style={styles.foryouTitle}>Curated For You</Text>
            <Text style={styles.foryouSubtitle}>
              Based on your taste preferences
            </Text>
            {items.slice(0, 3).map((it) => (
              <ForYouCard
                key={it.item_id + "-" + it.shopName}
                item={it}
                shopName={it.shopName}
              />
            ))}
          </View>
        </ScrollView>

        {editingEntry && (
          <EditLogSheet
            visible={editVisible}
            onClose={() => {
              setEditVisible(false);
              setEditingEntry(null);
            }}
            entry={editingEntry}
            onSaved={(updated) => {
              setLogs((prev) =>
                prev.map((l) => (l.id === updated.id ? updated : l)),
              );
              setEditingEntry(null);
            }}
            onDeleted={() => {
              setLogs((prev) => prev.filter((l) => l.id !== editingEntry?.id));
              setEditingEntry(null);
            }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  foryouTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: 6,
  },
  foryouSubtitle: {
    fontSize: 14,
    color: "#6D4C41",
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: 6,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6D4C41",
  },
});

export default HomeScreen;
