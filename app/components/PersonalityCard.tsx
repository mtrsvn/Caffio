import { Coffee } from "lucide-react-native";
import React from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
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
          <Coffee size={36} color="#fff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{personality.name}</Text>
          <Text style={styles.desc}>{personality.description}</Text>
        </View>
      </View>
      <View style={styles.tagsRow}>
        {personality.tags.map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  card: ViewStyle;
  header: TextStyle;
  body: ViewStyle;
  iconCircle: ViewStyle;
  info: ViewStyle;
  name: TextStyle;
  desc: TextStyle;
  tagsRow: ViewStyle;
  tagPill: ViewStyle;
  tagText: TextStyle;
}>({
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: colors.navbarBg,
    borderWidth: 1.2,
    borderColor: colors.navbarBorder,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gradientEnd,
    marginBottom: 12,
  },
  body: {
    flexDirection: "row",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gradientStart,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gradientEnd,
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: colors.iconInactive,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 12,
  },
  tagPill: {
    backgroundColor: colors.navbarBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.gradientEnd,
  },
});
