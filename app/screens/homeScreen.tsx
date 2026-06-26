import { LogIn, Sparkles } from "lucide-react-native";
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



const BASE_TABBAR_HEIGHT = 66;

// Match personality by scoring each one against the user's log tags
function matchPersonality(
  logs: any[],
  personalities: Personality[],
): Personality | null {
  if (!personalities.length) return null;
  if (!logs.length) return null;

  const tagWeights = new Map<string, number>();

  logs.forEach((log) => {
    const w = Math.max(1, Number(log.rating || 1)) + (log.favorite ? 2 : 0);
    const ct = (log.coffeeType || "").trim().toLowerCase();

    // Add coffeeType as a matchable tag + derived synonyms
    if (ct) {
      tagWeights.set(ct, (tagWeights.get(ct) || 0) + w);
      if (ct.includes("cold brew")) {
        ["cold", "iced", "cold brew"].forEach((t) =>
          tagWeights.set(t, (tagWeights.get(t) || 0) + w),
        );
      }
      if (ct === "espresso" || ct.includes("espresso")) {
        ["espresso", "strong", "bold"].forEach((t) =>
          tagWeights.set(t, (tagWeights.get(t) || 0) + w),
        );
      }
      if (ct.includes("frapp")) {
        ["frappe", "sweet", "creamy"].forEach((t) =>
          tagWeights.set(t, (tagWeights.get(t) || 0) + w),
        );
      }
      if (ct === "americano") {
        ["americano", "black", "pure"].forEach((t) =>
          tagWeights.set(t, (tagWeights.get(t) || 0) + w),
        );
      }
      if (ct === "latte") {
        tagWeights.set("latte", (tagWeights.get("latte") || 0) + w);
        tagWeights.set("milky", (tagWeights.get("milky") || 0) + w);
      }
      if (ct === "cappuccino") {
        tagWeights.set("cappuccino", (tagWeights.get("cappuccino") || 0) + w);
        tagWeights.set("smooth", (tagWeights.get("smooth") || 0) + w);
      }
      if (ct === "matcha") {
        tagWeights.set("matcha", (tagWeights.get("matcha") || 0) + w);
        tagWeights.set("trend", (tagWeights.get("trend") || 0) + w);
      }
      if (ct === "mocha") {
        tagWeights.set("mocha", (tagWeights.get("mocha") || 0) + w);
        tagWeights.set("sweet", (tagWeights.get("sweet") || 0) + w);
      }
    }

    // Add tasteProfile tags directly
    (log.tasteProfile || []).forEach((tag: string) => {
      const t = (tag || "").trim().toLowerCase();
      if (t) tagWeights.set(t, (tagWeights.get(t) || 0) + w);
    });
  });

  let bestScore = -1;
  let best = personalities[0];
  personalities.forEach((p) => {
    const score = p.tags.reduce(
      (sum, tag) => sum + (tagWeights.get(tag.toLowerCase()) || 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  });

  return best;
}

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const { user } = useContext(AuthContext);

  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [firstRun, setFirstRun] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [editingEntry, setEditingEntry] = React.useState<LogEntry | null>(null);
  const [editVisible, setEditVisible] = React.useState(false);

  // Derive personality from logs; fall back to first entry until logs load
  const personality: Personality = React.useMemo(() => {
    const list: Personality[] = personalitiesData as any;
    if (!list.length) return { name: "", description: "", tags: [] };
    const matched = matchPersonality(logs, list);
    return matched ?? list[0];
  }, [logs]);
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
        setLogs(fetched); // keep all for personality matching
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
    <View style={styles.screenContainer}>
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
            paddingTop: 4,
            paddingBottom:
              BASE_TABBAR_HEIGHT +
              (insets.bottom ?? (Platform.OS === "ios" ? 20 : 8)) +
              12,
          }}
        >
          {user ? (
            <PersonalityCard personality={personality} />
          ) : (
            <View style={styles.personalityEmptyCard}>
              <Text style={styles.personalityHeader}>
                Your Coffee Personality
              </Text>
              <View style={styles.personalityBody}>
                <View style={styles.personalityIconCircle}>
                  <LogIn size={36} color="#fff" />
                </View>
                <View style={styles.personalityInfo}>
                  <Text style={styles.emptyTitle}>
                    Log in to see your personality
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Sign in so we can show your coffee match
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* sample logs */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Your Coffee Logs</Text>
              <Text style={styles.subtitle}>
                Track and review your coffee experiences
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              {logs.slice(0, 3).map((entry) => (
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
              {!firstRun && !user && (
                <View style={styles.emptyCard}>
                  <LogIn
                    size={32}
                    color={colors.gradientStart}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>
                    Log in to view your entries
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Sign in to track your coffee journey
                  </Text>
                </View>
              )}
              {!firstRun && user && logs.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyTitle}>No logs yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the + button to log your first coffee!
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* For You recommendations */}
          <View style={[{ marginTop: 12, paddingHorizontal: 16 }]}>
            <Text style={styles.foryouTitle}>Curated For You</Text>
            <Text style={styles.foryouSubtitle}>
              Based on your taste preferences
            </Text>
            {topRecs.length > 0 ? (
              topRecs.map((rec) => (
                <ForYouCard
                  key={rec.item.item_id + "-" + rec.shopName}
                  item={rec.item}
                  shopName={rec.shopName}
                  matchScore={rec.score}
                />
              ))
            ) : !firstRun && !user ? (
              <View style={styles.emptyCard}>
                <Sparkles
                  size={32}
                  color={colors.gradientStart}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>
                  Log in for personalised picks
                </Text>
                <Text style={styles.emptySubtitle}>
                  Sign in so we can match drinks to your taste
                </Text>
              </View>
            ) : !firstRun && user && logs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>Log a coffee first</Text>
                <Text style={styles.emptySubtitle}>
                  We'll curate picks based on what you enjoy
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {editingEntry && (
          <EditLogSheet
            visible={editVisible}
            onClose={() => {
              setEditVisible(false);
            }}
            onExited={() => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#EDE8E2" },
  foryouTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  foryouSubtitle: {
    fontSize: 12,
    color: colors.accentLight,
    marginBottom: 10,
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
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
  emptyCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: "#EDE8E2",
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 6, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  personalityEmptyCard: {
    margin: 16,
    borderRadius: 20,
    backgroundColor: "#EDE8E2",
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 6, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  personalityHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  personalityBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  personalityIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  personalityInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
});

export default HomeScreen;
