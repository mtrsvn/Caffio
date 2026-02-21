/**
 * app/components/cafeCards.tsx
 *
 * Updated per request:
 * - card body background uses colors.navbarBg
 * - thin border uses colors.navbarBorder
 * - pronounced shadow on the card
 * - distance badge background matches card background (with thin border for contrast)
 * - distance badge has Navigation icon immediately before bold distance text
 * - hours on its own line below address with spacing from the clock icon
 *
 * Make sure colors.ts exports the same keys used here and is colocated:
 *   import colors from "./colors";
 *
 * Requires lucide-react-native + react-native-svg:
 *   npm install lucide-react-native react-native-svg
 */

import { Clock, MapPin, Navigation } from "lucide-react-native";
import React from "react";
import {
  GestureResponderEvent,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "./colors";

type Props = {
  name: string;
  address?: string | null;
  distanceKm?: number | null;
  hoursText?: string | null; // e.g. "Open until 10:00 PM"
  openNow?: boolean | undefined;
  photoUrl?: string | null;
  onPress?: (e?: GestureResponderEvent) => void;
};

export default function CafeCard({
  name,
  address,
  distanceKm,
  hoursText,
  openNow,
  photoUrl,
  onPress,
}: Props) {
  const NAVBAR_BG = colors.navbarBg;
  const BORDER = colors.navbarBorder;
  const NAVBAR_TEXT = colors.gradientEnd; // dark heading color
  const MUTED = colors.iconInactive; // muted text/icon color

  const validImage =
    typeof photoUrl === "string" &&
    photoUrl.length > 0 &&
    /^https?:\/\//i.test(photoUrl)
      ? photoUrl
      : "https://source.unsplash.com/1200x800/?coffee,cafe";

  const distanceLabel =
    typeof distanceKm === "number"
      ? distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`
      : null;

  const hoursDisplay =
    typeof hoursText === "string" && hoursText.length
      ? hoursText
      : openNow === undefined
        ? "Hours unknown"
        : openNow
          ? "Open now"
          : "Closed";

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
          { backgroundColor: NAVBAR_BG, borderColor: BORDER },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: validImage }}
            style={styles.image}
            resizeMode="cover"
          />
          {distanceLabel ? (
            <View
              style={[
                styles.distanceBadge,
                { backgroundColor: NAVBAR_BG, borderColor: BORDER },
              ]}
            >
              <Navigation size={14} color={NAVBAR_TEXT} />
              <Text
                style={[styles.distanceLabel, { color: NAVBAR_TEXT }]}
              >{` ${distanceLabel}`}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text
            style={[styles.title, { color: NAVBAR_TEXT }]}
            numberOfLines={1}
          >
            {name}
          </Text>

          <View style={styles.addressRow}>
            <MapPin size={14} color={MUTED} />
            <Text
              style={[styles.addressText, { color: MUTED }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {address ?? "Address unknown"}
            </Text>
          </View>

          <View style={styles.hoursRow}>
            <Clock size={14} color={MUTED} />
            <Text
              style={[styles.hoursText, { color: MUTED }]}
              numberOfLines={1}
            >
              {"\u00A0\u00A0"}
              {hoursDisplay}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.6, // super-thin border
    // iOS shadow (stronger lift)
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    // Android elevation
    elevation: 12,
  },
  imageContainer: {
    width: "100%",
    height: 150,
    backgroundColor: "#eaeaea",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    // same bg as card via inline style
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.6, // thin border so badge is visible over image
    // subtle shadow to lift badge a bit
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  distanceLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700", // bold distance number
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  hoursRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  hoursText: {
    fontSize: 13,
    marginLeft: 8, // spacing between clock icon and text
  },
});
