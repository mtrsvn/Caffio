import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthProvider from "./components/AuthProvider";
import Navigation from "./components/navigation";
import { ThemeProvider, useTheme } from "./components/ThemeContext";

import {
  FunnelSans_400Regular,
  FunnelSans_600SemiBold,
  FunnelSans_700Bold,
  useFonts,
} from "@expo-google-fonts/funnel-sans";

function AppInner() {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.gradient, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Navigation />
    </View>
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    FunnelSans_400Regular,
    FunnelSans_600SemiBold,
    FunnelSans_700Bold,
  });

  if (fontsLoaded) {
    if ((Text as any).defaultProps == null) {
      (Text as any).defaultProps = {};
    }

    (Text as any).defaultProps.style = {
      ...(Text as any).defaultProps.style,
      fontFamily: "FunnelSans_400Regular",
    };

    if ((TextInput as any).defaultProps == null) {
      (TextInput as any).defaultProps = {};
    }
    (TextInput as any).defaultProps.style = {
      ...(TextInput as any).defaultProps.style,
      fontFamily: "FunnelSans_400Regular",
    };
  }

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
