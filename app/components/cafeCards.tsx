import { MapPin } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "./colors";

type Props = {
  name: string;
  address?: string | null;
  onPress?: () => void;
};

export default function CafeCard({ name, address, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
    >
      {/* Icon */}
      <View style={styles.iconWrap}>
        <MapPin size={20} color={colors.accent} strokeWidth={1.8} />
      </View>

      {/* Text */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        {address ? (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        ) : null}
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
});
