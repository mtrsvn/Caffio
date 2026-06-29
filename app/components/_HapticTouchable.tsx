import * as Haptics from "expo-haptics";
import React from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
} from "react-native";

export interface HapticTouchableProps extends TouchableOpacityProps {
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const HapticTouchable = React.forwardRef<any, HapticTouchableProps>(
  ({ onPress, onPressIn, onPressOut, hapticStyle = Haptics.ImpactFeedbackStyle.Light, children, ...rest }, ref) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: GestureResponderEvent) => {
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    };
    const handlePress = (e: GestureResponderEvent) => {
      Haptics.impactAsync(hapticStyle);
      onPress?.(e);
    };

    return (
      <AnimatedTouchable 
        ref={ref} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress} 
        {...rest}
        style={[rest.style, { transform: [{ scale: scaleAnim }] }]}
      >
        {children}
      </AnimatedTouchable>
    );
  }
);

HapticTouchable.displayName = 'HapticTouchable';

export default HapticTouchable;
