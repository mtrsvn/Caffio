import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
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

  // sample log cards for display (static examples)
  const sampleLogs: LogEntry[] = React.useMemo(() => {
    const now = new Date();
    return [
      {
        id: "1",
        coffeeType: "Espresso",
        cafe: "Central Perk",
        rating: 4,
        tasteProfile: [],
        createdAt: new Date(now.getTime() - 86400000), // 1 day ago
        uid: "",
      },
      {
        id: "2",
        coffeeType: "Latte",
        cafe: "Bean There",
        rating: 5,
        tasteProfile: [],
        createdAt: new Date(now.getTime() - 2 * 86400000),
        uid: "",
      },
      {
        id: "3",
        coffeeType: "Cold Brew",
        cafe: "Java House",
        rating: 3,
        tasteProfile: [],
        createdAt: new Date(now.getTime() - 3 * 86400000),
        uid: "",
      },
    ];
  }, []);

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
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top ?? 0,
            paddingBottom: insets.bottom ?? 0,
          }}
        >
          <PersonalityCard personality={personality} />

          {/* sample logs */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Your Coffee Logs</Text>
              <Text style={styles.subtitle}>
                Track and review your coffee experiences
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              {sampleLogs.map((entry) => (
                <LogCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))}
            </View>
          </View>

          {/* For You recommendations */}
          <View style={[{ marginTop: 20, paddingHorizontal: 16 }]}>
            <Text style={styles.foryouTitle}>Curated For You</Text>
            <Text style={styles.foryouSubtitle}>
              Based on your taste preferences
            </Text>
            {items.map((it) => (
              <ForYouCard
                key={it.item_id + "-" + it.shopName}
                item={it}
                shopName={it.shopName}
              />
            ))}
          </View>
        </ScrollView>
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
