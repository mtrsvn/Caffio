import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface SyncLoaderProps {
  color?: string;
  size?: number;
  speedMultiplier?: number;
}

export const SyncLoader: React.FC<SyncLoaderProps> = ({
  color = "#000",
  size = 10,
  speedMultiplier = 1,
}) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 600 / speedMultiplier;

    const createAnimation = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]);
    };

    Animated.loop(
      Animated.stagger(duration / 3, [
        createAnimation(anim1),
        createAnimation(anim2),
        createAnimation(anim3),
      ])
    ).start();
  }, [anim1, anim2, anim3, speedMultiplier]);

  const getStyle = (anim: Animated.Value) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -size],
    });
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      marginHorizontal: size / 3,
      transform: [{ translateY }],
    };
  };

  return (
    <View style={styles.container}>
      <Animated.View style={getStyle(anim1)} />
      <Animated.View style={getStyle(anim2)} />
      <Animated.View style={getStyle(anim3)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
