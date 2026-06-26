import { Book, Home, MapPin, Star, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import colors from "./colors";

interface IconProps {
  name: "home" | "book" | "star" | "map-pin" | "user";
  focused: boolean;
}

const ICON_MAP = {
  home: Home,
  book: Book,
  star: Star,
  "map-pin": MapPin,
  user: User,
};

const ICON_SIZE = 22;
const ITEM_DIMENSION = 48;
const PILL_W = 48;
const PILL_H = 38;

const IconComponent: React.FC<IconProps> = ({ name, focused }) => {
  const LucideIcon = ICON_MAP[name] || Home;

  return (
    <View style={styles.itemContainer}>
      {focused ? (
        <View style={styles.focusedPill}>
          <LucideIcon size={ICON_SIZE} color={colors.bg} strokeWidth={2.2} />
        </View>
      ) : (
        <View style={styles.inactiveBox}>
          <LucideIcon size={ICON_SIZE} color={colors.textMuted} strokeWidth={1.8} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_DIMENSION,
    height: ITEM_DIMENSION,
    alignItems: "center",
    justifyContent: "center",
  },
  focusedPill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  inactiveBox: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default IconComponent;
