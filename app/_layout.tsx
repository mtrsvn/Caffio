import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text } from "react-native";
import {
  SafeAreaProvider
} from "react-native-safe-area-context";
import Navigation from "./components/navigation";

import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";

const BASE_TABBAR_HEIGHT = 66;
const FAB_EXTRA_OFFSET = 16; // visual gap above tab bar; tweak as needed

function AppInner() {
  const PAGE_GRADIENT = ["#EFEBE9", "#F5F5F5", "#D7CCC8"] as readonly string[];

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.gradient}
    >
      {/* Main app navigation */}
      <Navigation />
    </LinearGradient>
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // set default Text font once fonts are loaded
  if (fontsLoaded) {
    if ((Text as any).defaultProps == null) {
      (Text as any).defaultProps = {};
    }
    (Text as any).defaultProps.style = {
      ...(Text as any).defaultProps.style,
      fontFamily: "Montserrat_400Regular",
    };
  }

  if (!fontsLoaded) return null;

  // SafeAreaProvider must wrap any component using useSafeAreaInsets
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
