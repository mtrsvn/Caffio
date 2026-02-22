import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import colors from "../components/colors";

const ForgotPasswordScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={[
        colors.pageGradientTopLeft,
        colors.pageGradientMid,
        colors.pageGradientBottomRight,
      ]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
});

export default ForgotPasswordScreen;
