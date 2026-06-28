import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddLogSheet from "./addLogSheet";
import { AuthContext } from "./AuthProvider";
import { ThemeColors } from "./colors";
import { useThemeStyles, useTheme } from "./ThemeContext";
import FAB from "./fab";
import IconComponent from "./iconComponent";

const FAB_EXTRA_OFFSET = 16;

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
  Cafes: "Discover",
  Profile: "Profile",
};

const { width: screenWidth } = Dimensions.get("window");
const tabWidth = screenWidth / 5;

function CustomTabBarButton({
  focused,
  onPress,
  onLongPress,
  label,
  routeName,
}: any) {
  const { colors } = useTheme();
  const styles = useThemeStyles(getStyles);
  const focusAnim = useRef(new Animated.Value(focused ? 1.03 : 1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pressTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1.03 : 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 6,
    }).start();
  }, [focused, focusAnim]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const combinedScale = Animated.multiply(focusAnim, pressAnim);

  let iconName: "home" | "book" | "star" | "map-pin" | "user";
  switch (routeName) {
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

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
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
        <IconComponent name={iconName} focused={focused} />
        <Text
          style={{
            color: colors.iconInactive,
            fontSize: 12,
            marginTop: -2,
            fontWeight: focused ? "600" : "400",
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation, insets }: any) {
  const { colors } = useTheme();
  const styles = useThemeStyles(getStyles);
  const slideAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 9,
      tension: 65,
      overshootClamping: true,
    }).start();
  }, [state.index, slideAnim]);

  const baseBarHeight = 66;
  const tabBarHeight =
    baseBarHeight +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: tabBarHeight,
          paddingBottom: insets.bottom
            ? insets.bottom * 0.6
            : Platform.OS === "ios"
              ? 12
              : 8,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.slidingPill,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      />

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = LABEL_MAP[route.name] ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <CustomTabBarButton
            key={route.key}
            focused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={label}
            routeName={route.name}
          />
        );
      })}
    </View>
  );
}

// TabBarButton removed since we use custom TabBar

interface TabNavigatorProps {
  onFabPress: () => void;
  refreshFlag: number;
}

function TabNavigator({ onFabPress, refreshFlag }: TabNavigatorProps) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const styles = useThemeStyles(getStyles);
  const { colors } = useTheme();
  const baseBarHeight = 66;
  const tabBarHeight =
    baseBarHeight +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);

  const fabBottom = tabBarHeight + FAB_EXTRA_OFFSET;

  return (
    <>
      <Tab.Navigator
        detachInactiveScreens={false}
        tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
        sceneContainerStyle={{ backgroundColor: colors.bg }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          animation: "shift",
          lazy: false,
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

      {}
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
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshLogsFlag, setRefreshLogsFlag] = useState(0);

  useEffect(() => {
    if (!user) setSheetOpen(false);
  }, [user]);

  const handleSaved = (entry: any) => {
    setRefreshLogsFlag((f) => f + 1);
  };

  return (
    <>
      {}
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "push",
          contentStyle: { backgroundColor: colors.bg },
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

const getStyles = (colors: ThemeColors, isDark?: boolean) => StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: colors.navbarBg,
    borderTopWidth: 1,
    borderTopColor: colors.navbarBorder,
    paddingTop: 8,
    left: 0,
    right: 0,
    bottom: 0,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  slidingPill: {
    position: "absolute",
    left: (tabWidth - 48) / 2,
    top: 16,
    width: 48,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : colors.accent,
        shadowOpacity: isDark ? 0.8 : 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
    paddingTop: 0,
  },
});
