import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
