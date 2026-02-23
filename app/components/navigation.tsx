import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddLogSheet from "./addLogSheet";
import { AuthContext } from "./AuthProvider";
import colors from "./colors";
import FAB from "./fab";
import IconComponent from "./iconComponent";

// offset used when positioning the FAB above the tab bar
const FAB_EXTRA_OFFSET = 16; // same value as in layout

// screens
import CafeScreen from "../screens/cafeScreen";
import ForgotPasswordScreen from "../screens/forgotPasswordScreen";
import ForyouScreen from "../screens/foryouScreen";
import HomeScreen from "../screens/homeScreen";
import LoginScreen from "../screens/loginScreen";
import LogScreen from "../screens/logScreen";
import ProfileScreen from "../screens/profileScreen";
import RegisterScreen from "../screens/registerScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

interface TabNavigatorProps {
  onFabPress: () => void;
  refreshFlag: number;
}

function TabNavigator({ onFabPress, refreshFlag }: TabNavigatorProps) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const baseBarHeight = 66;
  const tabBarHeight =
    baseBarHeight +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  const fabBottom = tabBarHeight + FAB_EXTRA_OFFSET;

  return (
    <>
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
        <Tab.Screen name="Log">
          {() => <LogScreen refreshFlag={refreshFlag} />}
        </Tab.Screen>
        <Tab.Screen name="ForYou" component={ForyouScreen} />
        <Tab.Screen name="Cafes" component={CafeScreen} />
        <Tab.Screen name="Profile">
          {() => <ProfileScreen refreshFlag={refreshFlag} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* FAB for tabbed screens only */}
      {user && (
        <FAB
          onPress={onFabPress}
          style={{ bottom: fabBottom, right: 16 }}
          accessibilityLabel="Add"
          testID="global-fab"
        />
      )}
    </>
  );
}

export default function Navigation() {
  const { user } = useContext(AuthContext);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshLogsFlag, setRefreshLogsFlag] = useState(0);

  // always close sheet when the user logs out
  useEffect(() => {
    if (!user) setSheetOpen(false);
  }, [user]);

  const handleSaved = (entry: any) => {
    // bump flag to trigger log screen refresh
    setRefreshLogsFlag((f) => f + 1);
  };

  return (
    <>
      {/* stack navigator with sliding animations for smoother transitions */}
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "push",
        }}
      >
        <Stack.Screen name="Main">
          {() => (
            <TabNavigator
              onFabPress={() => setSheetOpen(true)}
              refreshFlag={refreshLogsFlag}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>

      <AddLogSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        uid={user?.uid ?? ""}
        onSaved={handleSaved}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // reserved for future styles if needed
});
