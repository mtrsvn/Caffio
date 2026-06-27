import { MapPin, Star } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import colors from "./colors";
import { SimplePlace } from "../utils/places";

type Props = {
  place: SimplePlace;
  onPress?: () => void;
};

export default function CafeCard({ place, onPress }: Props) {
  const { name, address, photoUrl, rating, totalRatings, openNow } = place;
  const displayName = name && name.length > 22 ? name.substring(0, 22) + "..." : name;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
    >
      {/* Icon or Image */}
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.imageThumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.imageThumbnail, styles.iconWrap]}>
          <MapPin size={24} color="#FFF" strokeWidth={1.8} />
        </View>
      )}

      {/* Text Info */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>
            {displayName}
          </Text>
          {rating ? (
            <View style={styles.ratingBadge}>
              <Star size={10} color="#FFF" fill="#FFF" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
        </View>

        {address ? (
          <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">
            {address}
          </Text>
        ) : null}
        
        <View style={styles.footerRow}>
          {openNow !== undefined && (
            <View style={[styles.statusPill, { backgroundColor: openNow ? "#E8F5E9" : "#FFEBEE" }]}>
              <Text style={[styles.statusText, { color: openNow ? "#2E7D32" : "#C62828" }]}>
                {openNow ? "Open Now" : "Closed"}
              </Text>
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
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 14,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  imageThumbnail: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: "#E4DED7",
  },
  iconWrap: {
    backgroundColor: colors.gradientStart,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.star,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 3,
  },
  address: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
