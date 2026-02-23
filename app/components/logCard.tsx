/**
 * app/components/logCard.tsx
 *
 * Card for a coffee log entry.
 * Layout: image on the LEFT, then title (coffee type), coffee shop, rating stars, and "X days ago".
 * Styled to match CafeCard (same shadow, border, background tokens).
 */

import { Plus, Star } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    Animated,
    Easing,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { updateCoffeeLog } from "../../firebaseconfig";
import colors from "./colors";

export type LogEntry = {
  id: string;
  coffeeType: string;
  cafe: string;
  rating: number;
  tasteProfile: string[];
  photoUri?: string | null;
  favorite?: boolean; // may be undefined for legacy entries
  createdAt: Date;
  uid: string;
};

type Props = {
  entry: LogEntry;
  onPress?: () => void;
  onToggleFavorite?: (newValue: boolean) => void;
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

export default function LogCard({ entry, onPress, onToggleFavorite }: Props) {
  const stars = [1, 2, 3, 4, 5];
  // animated scale for tap feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.94,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  };

  const [plusActive, setPlusActive] = useState(entry.favorite ?? false);
  // keep in sync if parent changes favorite flag
  React.useEffect(() => {
    setPlusActive(entry.favorite ?? false);
  }, [entry.favorite]);
  const plusScale = useRef(new Animated.Value(1)).current;
  const onPlusPress = async () => {
    Animated.sequence([
      Animated.timing(plusScale, {
        toValue: 0.88,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(plusScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 160,
      }),
    ]).start();
    const newVal = !plusActive;
    setPlusActive(newVal);
    try {
      // update backend
      await updateCoffeeLog(entry.uid, entry.id, { favorite: newVal });
    } catch (err) {
      // revert state on failure
      setPlusActive(plusActive);
      // eslint-disable-next-line no-console
      console.error("[LogCard] failed to set favorite", err);
    }
    onToggleFavorite?.(newVal);
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <AnimatedTouchable
      activeOpacity={0.95}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
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

        {/* plus icon at right side */}
        <AnimatedTouchable
          onPress={onPlusPress}
          activeOpacity={0.85}
          style={[
            styles.plusButton,
            {
              transform: [{ scale: plusScale }],
              backgroundColor: plusActive
                ? colors.gradientStart
                : "transparent",
              borderColor: plusActive ? "transparent" : colors.iconInactive,
              borderWidth: plusActive ? 0 : 1.2,
            },
          ]}
        >
          <Plus
            size={20}
            color={plusActive ? colors.navbarBg : colors.iconInactive}
          />
        </AnimatedTouchable>
      </View>
    </AnimatedTouchable>
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
    // paddingRight reserved for menu removed
    paddingRight: 4,
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
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    // default border is transparent; color set inline
    borderWidth: 1.2,
    borderColor: "transparent",
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
