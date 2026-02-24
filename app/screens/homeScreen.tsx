import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoffeeLogs } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
import LogCard, { LogEntry } from "../components/logCard";
import PersonalityCard, { Personality } from "../components/PersonalityCard";
import personalitiesData from "../data/personalities.json";

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

  // fetch last three logs for current user
  const { user } = useContext(AuthContext);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    if (!user) {
      setRecentLogs([]);
      return;
    }
    try {
      const all = (await getCoffeeLogs(user.uid)) as LogEntry[];
      setRecentLogs(all.slice(0, 3));
    } catch (err) {
      console.error("[HomeScreen] fetch logs", err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    // re-randomize personality as well
    loadLogs();
    setRefreshing(false);
  };

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          paddingTop: insets.top ?? 0,
          paddingBottom: insets.bottom ?? 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gradientStart}
            colors={[colors.gradientStart]}
          />
        }
      >
        <PersonalityCard personality={personality} />

        {/* most recent logs for logged-in user */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          {recentLogs.map((entry) => (
            <LogCard
              key={entry.id}
              entry={entry}
              onPress={() => {}}
              onToggleFavorite={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
});

export default HomeScreen;
