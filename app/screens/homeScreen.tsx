import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../components/colors";
import PersonalityCard, { Personality } from "../components/PersonalityCard";
import personalitiesData from "../data/personalities.json";
import LogCard, { LogEntry } from "../components/logCard";

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

  // sample log entries for home screen preview
  const sampleLogs: LogEntry[] = React.useMemo(() => {
    const now = new Date();
    return [
      { id: "h1", coffeeType: "Espresso", cafe: "Starbucks", rating: 4, tasteProfile: [], createdAt: now, uid: "", photoUri: null },
      { id: "h2", coffeeType: "Latte", cafe: "Krispy Kreme", rating: 5, tasteProfile: [], createdAt: now, uid: "", photoUri: null },
      { id: "h3", coffeeType: "Cold Brew", cafe: "Dunkin", rating: 3, tasteProfile: [], createdAt: now, uid: "", photoUri: null },
    ];
  }, []);

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top ?? 0,
          paddingBottom: insets.bottom ?? 0,
        }}
      >
        <PersonalityCard personality={personality} />

        {/* sample recent logs displayed below personality */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
});

export default HomeScreen;
