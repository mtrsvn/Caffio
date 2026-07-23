// Caffio — Neumorphism Design System

export type ThemeColors = {
  bg: string;
  shadowLight: string;
  shadowDark: string;
  gradientStart: string;
  gradientEnd: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfacePressed: string;
  accent: string;
  accentLight: string;
  star: string;
  navbarBg: string;
  navbarBorder: string;
  iconInactive: string;
  iconActive: string;
  pageGradientTopLeft: string;
  pageGradientMid: string;
  pageGradientBottomRight: string;
  pillUnselectedBg: string;
  coffeeTypeUnselectedBg: string;
  coffeeTypeUnselectedText: string;
  coffeeTypeUnselectedBorder: string;
  tasteSelectedGradientStart: string;
  tasteSelectedGradientEnd: string;
  actionText: string;
  border: string;
  inputBg: string;
  placeholder: string;
  danger: string;
  success: string;
};

export const lightColors: ThemeColors = {
  // ── Background ──────────────────────────────────────────────────
  bg: "#EDE8E2",               // warm soft beige — the one true background

  // ── Neumorphic Shadows ───────────────────────────────────────────
  shadowLight: "#FFFFFF",       // top-left highlight
  shadowDark: "#C8BEB4",        // bottom-right depth

  // ── Coffee Accent ────────────────────────────────────────────────
  gradientStart: "#6D4C41",     // medium espresso
  gradientEnd: "#3E2723",       // deep roast — primary text / headings

  // ── Text ─────────────────────────────────────────────────────────
  textPrimary: "#3E2723",
  textSecondary: "#795548",
  textMuted: "#A1887F",

  // ── Surface ──────────────────────────────────────────────────────
  surface: "#EDE8E2",           // same as bg — neumorphic elements blend in
  surfacePressed: "#E4DED7",    // pressed / inset state

  // ── Accent fills ─────────────────────────────────────────────────
  accent: "#6D4C41",
  accentLight: "#BCAAA4",

  // ── Star / Tag ───────────────────────────────────────────────────
  star: "#8D6E63",

  // ── Navbar (kept for compatibility) ──────────────────────────────
  navbarBg: "#EDE8E2",
  navbarBorder: "transparent",

  // ── Legacy aliases ───────────────────────────────────────────────
  iconInactive: "#8D6E63",
  iconActive: "#FFFFFF",
  pageGradientTopLeft: "#EDE8E2",
  pageGradientMid: "#EDE8E2",
  pageGradientBottomRight: "#EDE8E2",
  pillUnselectedBg: "#EDE8E2",
  coffeeTypeUnselectedBg: "#E0D9D2",
  coffeeTypeUnselectedText: "#5D4037",
  coffeeTypeUnselectedBorder: "rgba(109,76,65,0.15)",
  tasteSelectedGradientStart: "#8D6E63",
  tasteSelectedGradientEnd: "#6D4C41",
  actionText: "#5D4037",
  border: "rgba(93,64,55,0.14)",
  inputBg: "#F7F3EF",
  placeholder: "#9B8980",
  danger: "#B3261E",
  success: "#347A4A",
};

export const darkColors: ThemeColors = {
  bg: "#171412",
  shadowLight: "#342D29",
  shadowDark: "#090706",
  gradientStart: "#C88764",
  gradientEnd: "#925C43",
  textPrimary: "#F4ECE6",
  textSecondary: "#D1BEB2",
  textMuted: "#A59186",
  surface: "#211D1A",
  surfacePressed: "#2B2521",
  accent: "#B97755",
  accentLight: "#4A352B",
  star: "#E0A06F",
  navbarBg: "#1D1917",
  navbarBorder: "rgba(244,236,230,0.08)",
  iconInactive: "#A59186",
  iconActive: "#FFFFFF",
  pageGradientTopLeft: "#211A17",
  pageGradientMid: "#171412",
  pageGradientBottomRight: "#12100F",
  pillUnselectedBg: "#211D1A",
  coffeeTypeUnselectedBg: "#2A2420",
  coffeeTypeUnselectedText: "#E8DDD6",
  coffeeTypeUnselectedBorder: "rgba(244,236,230,0.11)",
  tasteSelectedGradientStart: "#C88764",
  tasteSelectedGradientEnd: "#925C43",
  actionText: "#F4ECE6",
  border: "rgba(244,236,230,0.11)",
  inputBg: "#211D1A",
  placeholder: "#88766C",
  danger: "#FFB4AB",
  success: "#8FD3A4",
};

// ── Legacy default export for un-refactored files ──────────────────
export default lightColors;

// ── Neumorphic shadow helpers ────────────────────────────────────────

// Legacy hardcoded neumorphism
export const neu = {
  raised: {
    shadowColor: "#C8BEB4",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: "#EDE8E2",
  },
  pressed: {
    shadowColor: "#C8BEB4",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
    backgroundColor: "#E4DED7",
  },
  flat: {
    backgroundColor: "#EDE8E2",
  },
};

export const getNeu = (colors: ThemeColors, isDark: boolean) => ({
  raised: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: isDark ? 0.8 : 0.55,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: isDark ? colors.surface : colors.bg,
  },
  pressed: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: isDark ? 0.8 : 0.3,
    shadowRadius: 4,
    elevation: 1,
    backgroundColor: colors.surfacePressed,
  },
  flat: {
    backgroundColor: colors.bg,
  },
});
