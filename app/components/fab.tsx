import { Plus } from "lucide-react-native";
import React from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  View,
  ViewStyle
, TouchableOpacity} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "./colors";
import HapticTouchable from "./_HapticTouchable";

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
    <HapticTouchable
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
    </HapticTouchable>
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
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
      },
      android: {  },
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
