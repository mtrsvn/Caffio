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
import ForYouCard, { PalateRecommendation } from "../components/forYouCard";
import { GEMINI_BACKEND_URL } from "../config";
import { Coffee } from "lucide-react-native";
import { SyncLoader } from "../components/SyncLoader";

const BASE_TABBAR_HEIGHT = 66;

const ForyouScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = React.useContext(AuthContext);

  const [refreshing, setRefreshing] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<PalateRecommendation[]>([]);
  const [recError, setRecError] = React.useState<string | null>(null);

  const fetchRecommendations = React.useCallback(async () => {
    if (!user) {
      setRecommendations([]);
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
        setRecommendations([]);
        setRecError("Add a coffee log to get personalized matches.");
        setRefreshing(false);
        return;
      }

      const payload = {
        userId: user.uid,
        userLogs: normalizedLogs,
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
      setRecommendations(data.recommendations || []);
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
  }, [user]);

  const onRefresh = React.useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  React.useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 8 }]}>
        <Text style={styles.title}>Palate Expansion</Text>
        <Text style={styles.subtitle}>Discover new styles of coffee based on your taste</Text>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom ?? 0 }]}>
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: tabBarHeight + 12 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={["transparent"]}
              progressBackgroundColor="transparent"
              progressViewOffset={-1000}
            />
          }
        >
          {refreshing && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <SyncLoader color={colors.gradientStart} size={10} speedMultiplier={0.8} />
            </View>
          )}
          {recommendations.length === 0 && !refreshing ? (
            <View style={styles.emptyCard}>
               <Text style={styles.emptyTitle}>{recError || "Log a coffee first"}</Text>
               <Text style={styles.emptySubtitle}>We'll curate picks based on what you enjoy</Text>
            </View>
          ) : (
            recommendations.map((it) => (
              <ForYouCard
                key={it.id}
                item={it}
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
});

export default ForyouScreen;
