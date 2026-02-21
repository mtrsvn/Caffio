import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from "./components/navigation";

export default function Layout() {
  // keep the colors inline; typed readonly so it's immutable
  const PAGE_GRADIENT = ["#EFEBE9", "#F5F5F5", "#D7CCC8"] as readonly string[];

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LinearGradient
        // cast to any to satisfy the LinearGradient prop types (TypeScript mismatch)
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
