import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors, ThemeColors } from "./colors";

export type ThemeMode = "system" | "light" | "dark";

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  isDark: false,
  colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Load saved mode from AsyncStorage
    AsyncStorage.getItem("@theme_mode").then((savedMode) => {
      if (savedMode && ["system", "light", "dark"].includes(savedMode)) {
        setMode(savedMode as ThemeMode);
      }
    });

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem("@theme_mode", newMode);
  };

  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export function useThemeStyles<T>(styleCreator: (colors: ThemeColors, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  return React.useMemo(() => styleCreator(colors, isDark), [colors, isDark, styleCreator]);
}
