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
  const displayName = name && name.length > 20 ? name.substring(0, 20) + "..." : name;
  return (
    <TouchableOpacity
      activeOpacity={0.92}
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
        <View style={[styles.iconWrap, { backgroundColor: colors.gradientStart }]}>
          <MapPin size={20} color="#FFF" strokeWidth={1.8} />
        </View>
      )}

      {/* Text */}
      <View style={styles.body}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>
            {displayName}
          </Text>
          {rating ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Star size={12} color={colors.star} fill={colors.star} />
              <Text style={{ fontSize: 12, color: colors.star, fontWeight: "600", marginLeft: 4 }}>
                {rating}
              </Text>
            </View>
          ) : null}
        </View>

        {address ? (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        ) : null}
        
        {openNow !== undefined && (
          <Text style={[styles.statusText, { color: openNow ? "#388E3C" : "#D32F2F" }]}>
            {openNow ? "Open Now" : "Closed"}
          </Text>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E4DED7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
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
  imageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: "#E4DED7",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  address: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
