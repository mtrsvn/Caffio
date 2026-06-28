import { MapPin, Star, Clock } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { ThemeColors, getNeu } from "./colors";
import { useThemeStyles, useTheme } from "./ThemeContext";
import { SimplePlace } from "../utils/places";

type Props = {
  place: SimplePlace & { distanceKm?: number };
  onPress?: () => void;
};

function formatDistance(km?: number): string | null {
  if (km === undefined || km === null) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

const CafeCard: React.FC<Props> = ({ place, onPress }) => {
  const { colors, isDark } = useTheme();
  const styles = useThemeStyles(getStyles);
  const { name, address, photoUrl, rating, openNow } = place;
  const dist = formatDistance((place as any).distanceKm);

  return (
    <View style={styles.cardShadow}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.card}
        accessibilityRole="button"
      >
        <View style={styles.imageWrap}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <MapPin size={32} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
            </View>
          )}

          {openNow !== undefined && (
            <View style={[styles.statusBadge, { backgroundColor: openNow ? "rgba(46,125,50,0.88)" : "rgba(183,28,28,0.88)" }]}>
              <Clock size={10} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.statusBadgeText}>{openNow ? "Open" : "Closed"}</Text>
            </View>
          )}

          {dist && (
            <View style={[styles.distanceBadge, { backgroundColor: isDark ? "rgba(30,26,24,0.92)" : "rgba(237,232,226,0.92)" }]}>
              <MapPin size={10} color={colors.accent} strokeWidth={2.5} />
              <Text style={styles.distanceText}>{dist}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            {address ? (
              <Text style={styles.address} numberOfLines={1}>{address}</Text>
            ) : null}
          </View>

          {rating ? (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#FFF" fill="#FFF" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => {
  const neu = getNeu(colors, isDark);
  return StyleSheet.create({
    cardShadow: {
      borderRadius: 18,
      marginBottom: 12,
      backgroundColor: colors.surface,
      ...neu.raised,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    imageWrap: {
      position: "relative",
      width: "100%",
      height: 160,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroPlaceholder: {
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    statusBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusBadgeText: {
      color: "#FFF",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    distanceBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    distanceText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.accent,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    infoLeft: {
      flex: 1,
      marginRight: 10,
    },
    title: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    address: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500",
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 14,
    },
    ratingText: {
      color: "#FFF",
      fontSize: 12,
      fontWeight: "700",
    },
  });
};

export default React.memo(CafeCard);
