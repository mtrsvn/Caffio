import React from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoffeeLogs } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
import ForYouCard from "../components/forYouCard";
import { GEMINI_BACKEND_URL } from "../config";
import shops from "../data/shops.json";



const BASE_TABBAR_HEIGHT = 66;

const ForyouScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = React.useContext(AuthContext);

  const [refreshing, setRefreshing] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<
    Record<string, { score: number }>
  >({});
  const [recError, setRecError] = React.useState<string | null>(null);

  // flatten menu items from all shops (menu arrays might be nested)
  const items = React.useMemo(() => {
    type Shop = { shop_id: string; name: string; menu: any[] };
    const shopsData: Shop[] = shops as any;
    return shopsData.flatMap((shop) => {
      // ensure we have a flat list of menu objects
      const flatMenu = Array.isArray(shop.menu)
        ? (shop.menu as any[]).flat(Infinity)
        : [];
      return flatMenu.map((it) => ({ ...it, shopName: shop.name }));
    });
  }, []);

  const makeKey = React.useCallback(
    (itemId: string, shopName: string) => `${itemId}::${shopName}`,
    [],
  );

  const fetchRecommendations = React.useCallback(async () => {
    if (!user) {
      setRecommendations({});
      setRecError("Log in to see personalized matches.");
      setRefreshing(false);
      return;
    }

    setRecError(null);
    setRefreshing(true);

    try {
      const logs = await getCoffeeLogs(user.uid);
      const normalizedLogs = (logs || []).map((log: any) => ({
        coffeeType: log.coffeeType ?? "",
        tasteProfile: Array.isArray(log.tasteProfile) ? log.tasteProfile : [],
        rating: Number(log.rating ?? 0),
        favorite: Boolean(log.favorite),
        cafe: log.cafe ?? "",
      }));

      if (normalizedLogs.length === 0) {
        setRecommendations({});
        setRecError("Add a coffee log to get personalized matches.");
        setRefreshing(false);
        return;
      }

      const payload = {
        userId: user.uid,
        userLogs: normalizedLogs,
        items: items.map((it) => ({
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

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load recommendations");
      }

      const data = await response.json();
      const map: Record<string, { score: number }> = {};
      (data.recommendations || []).forEach((rec: any) => {
        const key = makeKey(rec.item_id, rec.shopName);
        map[key] = {
          score: typeof rec.score === "number" ? rec.score : 0,
        };
      });
      setRecommendations(map);
    } catch (err: any) {
      console.error("[ForyouScreen] recommendation fetch failed", err);
      setRecError(
        err?.message
          ? `${err.message} (backend: ${GEMINI_BACKEND_URL})`
          : `Unable to load matches (backend: ${GEMINI_BACKEND_URL})`,
      );
    } finally {
      setRefreshing(false);
    }
  }, [items, makeKey, user]);

  const onRefresh = React.useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const recommendedItems = React.useMemo(() => {
    const scored = items
      .map((it) => {
        const rec = recommendations[makeKey(it.item_id, it.shopName)];
        return rec ? { item: it, score: rec.score } : null;
      })
      .filter(Boolean) as { item: any; score: number }[];

    if (scored.length === 0) {
      return [];
    }

    return scored
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 30) // show more recommendations
      .map((s) => ({ ...s.item, _score: s.score }));
  }, [items, recommendations, makeKey]);

  React.useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 8 }]}>
        <Text style={styles.title}>Curated For You</Text>
        <Text style={styles.subtitle}>Based on your taste preferences</Text>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom ?? 0 }]}>
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: tabBarHeight + 12 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.pageGradientMid]}
              tintColor="#6D4C41"
            />
          }
        >
          {recommendedItems.length === 0 ? (
            <Text style={{ color: colors.iconInactive, marginTop: 6 }}>
              {recError || "No recommendations yet."}
            </Text>
          ) : (
            recommendedItems.map((it) => (
              <ForYouCard
                key={it.item_id + "-" + it.shopName}
                item={it}
                shopName={it.shopName}
                matchScore={
                  typeof it._score === "number" ? it._score : undefined
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#EDE8E2" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.accentLight,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

export default ForyouScreen;
