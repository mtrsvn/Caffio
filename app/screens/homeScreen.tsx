import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";

const PAGE_GRADIENT = ["#EFEBE9", "#F5F5F5", "#D7CCC8"] as readonly string[];

const HomeScreen: React.FC = () => (
  <LinearGradient
    colors={PAGE_GRADIENT as any}
    start={[0, 0]}
    end={[1, 1]}
    style={styles.screenContainer}
  />
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
});

export default HomeScreen;
