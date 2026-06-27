import * as Haptics from "expo-haptics";
import React from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

export interface HapticTouchableProps extends TouchableOpacityProps {
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const HapticTouchable = React.forwardRef<any, HapticTouchableProps>(
  ({ onPress, hapticStyle = Haptics.ImpactFeedbackStyle.Light, children, ...rest }, ref) => {
    const handlePress = (e: GestureResponderEvent) => {
      Haptics.impactAsync(hapticStyle);
      onPress?.(e);
    };

    return (
      <TouchableOpacity onPress={handlePress} ref={ref} {...rest}>
        {children}
      </TouchableOpacity>
    );
  }
);

HapticTouchable.displayName = 'HapticTouchable';

export default HapticTouchable;
