import { LinearGradient } from "expo-linear-gradient";
import { Coffee, MapPin, Star } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "./colors";

export type MenuItem = {
  item_id: string;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
};

type Props = {
  item: MenuItem;
  shopName: string;
  matchScore?: number;
  onPress?: () => void;
};

export default function ForYouCard({ item, shopName, matchScore, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
    >
      {/* Left circular gradient avatar */}
      <LinearGradient
        colors={[colors.tasteSelectedGradientStart, colors.tasteSelectedGradientEnd]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.avatar}
      >
        <Coffee size={18} color="#fff" />
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.row}>
          <MapPin size={11} color={colors.textMuted} />
          <Text style={styles.rowText} numberOfLines={1}>
            {shopName}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {typeof matchScore === "number" && (
            <View style={styles.matchChip}>
              <Star size={10} color={colors.accent} fill={colors.accent} strokeWidth={0} />
              <Text style={styles.matchText}>{Math.round(matchScore)}% match</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE8E2",
    borderRadius: 18,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#6D4C41",
        shadowOffset: { width: 1, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  rowText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E4DED7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent,
  },
  categoryChip: {
    backgroundColor: "rgba(109,76,65,0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    color: "#5D4037",
    fontWeight: "600",
  },
});
