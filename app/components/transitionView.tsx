import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function TransitionView({ children, style }: Props) {
  const isFocused = useIsFocused();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFocused ? 1 : 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isFocused, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const opacity = anim;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});

export function withTransition<T extends object>(
  Component: React.ComponentType<T>,
): React.ComponentType<T> {
  return function Wrapped(props: T) {
    return (
      <TransitionView>
        <Component {...props} />
      </TransitionView>
    );
  };
}
