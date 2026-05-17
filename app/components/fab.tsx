import { Plus } from "lucide-react-native";
import React from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "./colors";

type Props = {
  onPress?: (e?: GestureResponderEvent) => void;
  size?: number;
  style?: ViewStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
};

export default function FAB({
  onPress,
  size = 56,
  style,
  icon,
  accessibilityLabel = "Add",
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const defaultBottom = (insets.bottom ?? 12) + 16;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          right: 20,
          bottom: defaultBottom,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { borderRadius: size / 2 }]}>
        {icon ?? (
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backgroundColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  inner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
});
