import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const MapView = React.forwardRef((props: any, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));

  return (
    <View style={[props.style, styles.container]}>
      <Text style={styles.text}>Maps are not supported on the web.</Text>
      {props.children}
    </View>
  );
});

export const Marker = (props: any) => null;
export const Callout = (props: any) => null;
export const PROVIDER_GOOGLE = "google";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e0e0",
  },
  text: {
    color: "#666",
  },
});

export default MapView;
