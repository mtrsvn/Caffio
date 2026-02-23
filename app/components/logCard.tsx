/**
 * app/components/logCard.tsx
 *
 * Card for a coffee log entry.
 * Layout: image on the LEFT, then title (coffee type), coffee shop, rating stars, and "X days ago".
 * Styled to match CafeCard (same shadow, border, background tokens).
 */

import { MoreVertical, Star } from "lucide-react-native";
import React from "react";
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import colors from "./colors";

export type LogEntry = {
  id: string;
  coffeeType: string;
  cafe: string;
  rating: number;
  tasteProfile: string[];
  photoUri?: string | null;
  createdAt: Date;
  uid: string;
};

type Props = {
  entry: LogEntry;
  onPress?: () => void;
  onMenuPress?: () => void;
};

function daysAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

const IMAGE_SIZE = 80;

export default function LogCard({ entry, onPress, onMenuPress }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.navbarBg,
            borderColor: colors.navbarBorder,
          },
        ]}
      >
        {/* Left: photo thumbnail */}
        <View style={styles.imageContainer}>
          {entry.photoUri ? (
            <Image
              source={{ uri: entry.photoUri }}
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>☕</Text>
            </View>
          )}
        </View>
        {/* Right: info */}
        <View style={styles.body}>
          {/* Coffee type (title) */}
          <Text
            style={[styles.title, { color: colors.gradientEnd }]}
            numberOfLines={1}
          >
            {entry.coffeeType}
          </Text>

          {/* Coffee shop */}
          <Text
            style={[styles.cafe, { color: colors.iconInactive }]}
            numberOfLines={1}
          >
            {entry.cafe}
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {stars.map((s) => (
              <Star
                key={s}
                size={13}
                color={colors.gradientStart}
                fill={entry.rating >= s ? colors.gradientStart : "transparent"}
                strokeWidth={entry.rating >= s ? 0 : 1.5}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>

          {/* Days ago */}
          <Text style={[styles.daysAgo, { color: colors.iconInactive }]}>
            {daysAgo(entry.createdAt)}
          </Text>
        </View>
        {onMenuPress && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color={colors.iconInactive} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.6,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8, // leave space for menu button
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 12,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.navbarBorder,
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  cafe: {
    fontSize: 13,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  daysAgo: {
    fontSize: 12,
  },
  menuButton: {
    padding: 12,
  },
});
