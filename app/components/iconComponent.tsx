import { LinearGradient } from "expo-linear-gradient";
import { Book, Home, MapPin, Star, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
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

const ICON_SIZE = 24;
const ITEM_DIMENSION = 48; 
const CIRCLE_DIMENSION = 44; 
const BORDER_RADIUS = 15; 

const IconComponent: React.FC<IconProps> = ({ name, focused }) => {
  const LucideIcon = ICON_MAP[name] || Home;

  return (
    <View style={styles.itemContainer}>
      {focused ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.focusedBg, { borderRadius: BORDER_RADIUS }]}
        >
          <LucideIcon
            size={ICON_SIZE}
            color={colors.iconActive}
            strokeWidth={2}
          />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveBox}>
          <LucideIcon
            size={ICON_SIZE}
            color={colors.iconInactive}
            strokeWidth={2}
          />
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
  focusedBg: {
    width: CIRCLE_DIMENSION,
    height: CIRCLE_DIMENSION,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  inactiveBox: {
    width: CIRCLE_DIMENSION,
    height: CIRCLE_DIMENSION,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default IconComponent;
