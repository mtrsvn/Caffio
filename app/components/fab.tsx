import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import React from "react";
import {
  GestureResponderEvent,
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
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          right: 16,
          bottom: defaultBottom,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={[0, 0]}
        end={[1, 1]}
        style={[
          styles.gradient,
          {
            borderRadius: size / 2,
            width: size,
            height: size,
          },
        ]}
      >
        {icon ? (
          <View>{icon}</View>
        ) : (
          
          <Plus size={28} color={colors.iconActive} strokeWidth={3} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",

    
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    
    elevation: 14,

    
    zIndex: 2000,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
});
