import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "./colors";
import IconComponent from "./iconComponent";

// screens
import CafeScreen from "../screens/cafeScreen";
import ForyouScreen from "../screens/foryouScreen";
import HomeScreen from "../screens/homeScreen";
import LogScreen from "../screens/logScreen";
import ProfileScreen from "../screens/profileScreen";

const Tab = createBottomTabNavigator();

const LABEL_MAP: Record<string, string> = {
  Home: "Home",
  Log: "Log",
  ForYou: "For You",
  Cafes: "Cafes",
  Profile: "Profile",
};

function TabBarButton({ children, onPress, accessibilityState }: any) {
  const selected = !!accessibilityState?.selected;

  // focusAnim: 1 -> not selected, 1.03 -> selected (subtle lift)
  const focusAnim = useRef(new Animated.Value(selected ? 1.03 : 1)).current;
  // pressAnim: 1 -> idle, 0.92 -> pressed (quick press feedback)
  const pressAnim = useRef(new Animated.Value(1)).current;
  // translateY for press (0 -> idle, 4 -> pressed)
  const pressTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: selected ? 1.03 : 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 6,
    }).start();
  }, [selected, focusAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 25,
        bounciness: 8,
      }),
      Animated.timing(pressTranslate, {
        toValue: 4,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.timing(pressTranslate, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Combined scale = focusAnim * pressAnim
  const combinedScale = Animated.multiply(focusAnim, pressAnim);

  return (
    <Pressable
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: "rgba(0,0,0,0.06)", radius: 28 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1 })}
    >
      <Animated.View
        style={{
          transform: [{ scale: combinedScale }, { translateY: pressTranslate }],
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function Navigation() {
  const insets = useSafeAreaInsets();
  const baseBarHeight = 66;
  const tabBarHeight =
    baseBarHeight +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        // Use our animated button wrapper
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarIcon: ({ focused }) => {
          let iconName: "home" | "book" | "star" | "map-pin" | "user";
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Log":
              iconName = "book";
              break;
            case "ForYou":
              iconName = "star";
              break;
            case "Cafes":
              iconName = "map-pin";
              break;
            case "Profile":
              iconName = "user";
              break;
            default:
              iconName = "home";
          }
          return <IconComponent name={iconName} focused={focused} />;
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              color: colors.iconInactive,
              fontSize: 12,
              marginTop: 12,
              fontWeight: focused ? "600" : "400",
              textAlign: "center",
            }}
          >
            {LABEL_MAP[route.name]}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.navbarBg,
          borderTopWidth: 1,
          borderTopColor: colors.navbarBorder,
          height: tabBarHeight,
          paddingTop: 14,
          paddingBottom: insets.bottom
            ? insets.bottom * 0.6
            : Platform.OS === "ios"
              ? 12
              : 8,
          left: 0,
          right: 0,
          bottom: 0,
          position: "absolute",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 4,
          paddingTop: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="ForYou" component={ForyouScreen} />
      <Tab.Screen name="Cafes" component={CafeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // reserved for future styles if needed
});
