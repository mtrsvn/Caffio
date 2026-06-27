import { Coffee } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import colors from "./colors";

export type Personality = {
  name: string;
  description: string;
  tags: string[];
};

type Props = {
  personality: Personality;
};

export default function PersonalityCard({ personality }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>Your Coffee Personality</Text>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Coffee size={32} color={colors.iconActive} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{personality.name}</Text>
          <Text style={styles.desc}>{personality.description}</Text>
        </View>
      </View>
      {personality.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {personality.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: "#EDE8E2",
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  header: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.coffeeTypeUnselectedText,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 6,
  },
  tagPill: {
    backgroundColor: "#E4DED7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
    }),
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
