/**
 * app/components/logCard.tsx
 * Neumorphic coffee log entry card.
 */

import { File, Heart, Star } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import HapticTouchable from "./_HapticTouchable";
import { updateCoffeeLog } from "../../firebaseconfig";
import colors from "./colors";

export type LogEntry = {
  id: string;
  coffeeType: string;
  cafe: string;
  rating: number;
  price?: number;
  tasteProfile: string[];
  photoUri?: string | null;
  favorite?: boolean;
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

const IMAGE_SIZE = 72;

export default function LogCard({ entry, onPress, onToggleFavorite }: Props) {
  const stars = [1, 2, 3, 4, 5];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
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

  const [isFav, setIsFav] = useState(entry.favorite ?? false);
  React.useEffect(() => {
    setIsFav(entry.favorite ?? false);
  }, [entry.favorite]);

  const favScale = useRef(new Animated.Value(1)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(HapticTouchable);

  const onFavPress = async () => {
    Animated.sequence([
      Animated.timing(favScale, { toValue: 0.8, duration: 70, useNativeDriver: true }),
      Animated.spring(favScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    const newVal = !isFav;
    setIsFav(newVal);
    try {
      await updateCoffeeLog(entry.uid, entry.id, { favorite: newVal });
    } catch {
      setIsFav(isFav);
    }
    onToggleFavorite?.(newVal);
  };

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
      accessibilityRole="button"
    >
      {/* Photo */}
      <View style={styles.imageWrap}>
        {entry.photoUri ? (
          <Image
            source={{ uri: entry.photoUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <File size={26} color={colors.accent} fill="none" strokeWidth={1.5} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.coffeeType}
        </Text>
        <Text style={styles.cafe} numberOfLines={1}>
          {entry.cafe}
        </Text>
        <View style={styles.starsRow}>
          {stars.map((s) => (
            <Star
              key={s}
              size={12}
              color={colors.star}
              fill={entry.rating >= s ? colors.star : "transparent"}
              strokeWidth={entry.rating >= s ? 0 : 1.5}
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
        <Text style={styles.daysAgo}>{daysAgo(entry.createdAt)}</Text>
      </View>

      {/* Favourite button */}
      <Animated.View style={{ transform: [{ scale: favScale }], marginRight: 14 }}>
        <HapticTouchable
          onPress={onFavPress}
          activeOpacity={0.8}
          style={[styles.favBtn, isFav && styles.favBtnActive]}
        >
          <Heart
            size={16}
            color={isFav ? "#fff" : colors.accent}
            fill={isFav ? "#fff" : "transparent"}
            strokeWidth={isFav ? 0 : 1.5}
          />
        </HapticTouchable>
      </Animated.View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE8E2",
    borderRadius: 18,
    marginBottom: 12,
    paddingRight: 4,
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
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 12,
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#E4DED7",
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4DED7",
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cafe: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  daysAgo: {
    fontSize: 11,
    color: colors.accentLight,
    letterSpacing: 0.2,
  },
  favBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4DED7",
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  favBtnActive: {
    backgroundColor: colors.accent,
  },
});
