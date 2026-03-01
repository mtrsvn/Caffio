import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import {
    Platform,
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
import { GEMINI_BACKEND_URL } from "../config";
import personalitiesData from "../data/personalities.json";
import shops from "../data/shops.json";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const BASE_TABBAR_HEIGHT = 66;

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

  // AI recommendations (top 3)
  const [topRecs, setTopRecs] = React.useState<
    Array<{ item: any; shopName: string; score: number }>
  >([]);

  const allItems = React.useMemo(() => {
    type Shop = { shop_id: string; name: string; menu: any[] };
    const shopsData: Shop[] = shops as any;
    return shopsData.flatMap((shop) => {
      const flatMenu = Array.isArray(shop.menu)
        ? (shop.menu as any[]).flat(Infinity)
        : [];
      return flatMenu.map((it) => ({ ...it, shopName: shop.name }));
    });
  }, []);

  const fetchRecommendations = React.useCallback(
    async (userLogs: LogEntry[]) => {
      if (!user || userLogs.length === 0) {
        setTopRecs([]);
        return;
      }
      try {
        const normalizedLogs = userLogs.map((log: any) => ({
          coffeeType: log.coffeeType ?? "",
          tasteProfile: Array.isArray(log.tasteProfile) ? log.tasteProfile : [],
          rating: Number(log.rating ?? 0),
          favorite: Boolean(log.favorite),
          cafe: log.cafe ?? "",
        }));

        const payload = {
          userId: user.uid,
          userLogs: normalizedLogs,
          items: allItems.map((it) => ({
            item_id: it.item_id,
            name: it.name,
            shopName: it.shopName,
            tasteProfile: it.tasteProfile ?? [],
            coffeeType: it.coffeeType ?? it.category ?? "",
          })),
        };

        const response = await fetch(
          `${GEMINI_BACKEND_URL}/api/recommendations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) return;

        const data = await response.json();
        const top3 = (data.recommendations || [])
          .slice(0, 3)
          .map((rec: any) => {
            const itemData = allItems.find(
              (it) =>
                it.item_id === rec.item_id && it.shopName === rec.shopName,
            );
            return itemData
              ? { item: itemData, shopName: rec.shopName, score: rec.score }
              : null;
          })
          .filter(Boolean);

        setTopRecs(top3);
      } catch (err) {
        console.error("[HomeScreen] recommendation fetch failed", err);
      }
    },
    [user, allItems],
  );

  const fetchLogs = React.useCallback(
    async (showSpinner = true) => {
      if (!user) {
        setLogs([]);
        setTopRecs([]);
        if (showSpinner) setRefreshing(false);
        setFirstRun(false);
        return;
      }
      if (showSpinner) setRefreshing(true);
      try {
        const fetched = (await getCoffeeLogs(user.uid)) as LogEntry[];
        setLogs(fetched.slice(0, 3));
        fetchRecommendations(fetched);
      } catch (err: any) {
        console.error("[HomeScreen] failed to load logs", err);
      } finally {
        if (showSpinner) setRefreshing(false);
        setFirstRun(false);
      }
    },
    [user, fetchRecommendations],
  );

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
            paddingTop: Math.max(6, (insets.top ?? 0) * 0.05), // smaller gap above personality card
            paddingBottom:
              BASE_TABBAR_HEIGHT +
              (insets.bottom ?? (Platform.OS === "ios" ? 20 : 8)) +
              12,
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
            {topRecs.map((rec) => (
              <ForYouCard
                key={rec.item.item_id + "-" + rec.shopName}
                item={rec.item}
                shopName={rec.shopName}
                matchScore={rec.score}
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
