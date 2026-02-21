import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import colors from "../components/colors";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const ProfileScreen: React.FC = () => (
  <LinearGradient
    colors={PAGE_GRADIENT as any}
    start={[0, 0]}
    end={[1, 1]}
    style={styles.screenContainer}
  />
);

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
});

export default ProfileScreen;
