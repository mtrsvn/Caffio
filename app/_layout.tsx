import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import FAB from "./components/fab";
import Navigation from "./components/navigation";

import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Optional: set default Text font for the whole app
  if (fontsLoaded) {
    // Ensure defaultProps exists (safely set only once)
    if ((Text as any).defaultProps == null) {
      (Text as any).defaultProps = {};
    }
    (Text as any).defaultProps.style = {
      ...(Text as any).defaultProps.style,
      fontFamily: "Montserrat_400Regular",
    };
  }

  if (!fontsLoaded) {
    // While fonts load, render nothing (or a splash). Keep this simple.
    return null;
  }

  const PAGE_GRADIENT = ["#EFEBE9", "#F5F5F5", "#D7CCC8"] as readonly string[];

  const insets = useSafeAreaInsets();
  const baseBarHeight = 66;
  const tabBarHeight =
    baseBarHeight +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
  const fabBottom = tabBarHeight + 16;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LinearGradient
        colors={PAGE_GRADIENT as any}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradient}
      >
        <Navigation />
        <FAB
          onPress={() => {}}
          style={{
            bottom: fabBottom,
          }}
        />
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
