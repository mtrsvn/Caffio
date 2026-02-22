import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AddLogSheet from "./components/addLogSheet"; // ensure this path is correct
import FAB from "./components/fab";
import Navigation from "./components/navigation";

import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";

const BASE_TABBAR_HEIGHT = 66;
const FAB_EXTRA_OFFSET = 16; // visual gap above tab bar; tweak as needed

function AppInner({ onFabPress }: { onFabPress: () => void }) {
  const insets = useSafeAreaInsets();

  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  // Put the FAB above the tab bar: safe area bottom + tab bar height + extra offset
  const fabBottom = tabBarHeight + FAB_EXTRA_OFFSET;

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

      {/* FAB rendered last so it overlays the navigation; style override positions it above the tab bar */}
      <FAB
        onPress={onFabPress}
        style={{ bottom: fabBottom, right: 16 }}
        accessibilityLabel="Add"
        testID="global-fab"
      />
    </LinearGradient>
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const [sheetOpen, setSheetOpen] = useState(false);

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
      <AppInner onFabPress={() => setSheetOpen(true)} />
      <AddLogSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
