import { MapPin } from "lucide-react-native";
import React from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import colors from "./colors";

type Props = {
  name: string;
  address?: string | null;
  onPress?: (e?: GestureResponderEvent) => void;
};

export default function CafeCard({ name, address, onPress }: Props) {
  const NAVBAR_BG = colors.navbarBg;
  const BORDER = colors.navbarBorder;
  const NAVBAR_TEXT = colors.gradientEnd;
  const MUTED = colors.iconInactive;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.wrapper]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.card,
          { backgroundColor: NAVBAR_BG, borderColor: BORDER },
        ]}
      >
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
        </View>
      </View>
    </TouchableOpacity>
  );
}

type Style = {
  wrapper: ViewStyle;
  card: ViewStyle;
  body: ViewStyle;
  title: TextStyle;
  addressRow: ViewStyle;
  addressText: TextStyle;
};

const styles = StyleSheet.create<Style>({
  wrapper: {
    marginBottom: 14,
    // subtle cross-platform shadow (matches search box)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  card: {
    borderRadius: 12,
    overflow: "hidden", // keep rounded corners for inner content
    borderWidth: 0.6,
    // backgroundColor and borderColor applied inline
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 25,
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
  },
  addressText: {
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
});
