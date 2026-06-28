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
};

export const darkColors: ThemeColors = {
  bg: "#12100E",               
  shadowLight: "#1F1C1A",      
  shadowDark: "#050404",       
  gradientStart: "#6D4C41",    
  gradientEnd: "#3E2723",      
  textPrimary: "#EAE3DB",
  textSecondary: "#BCAAA4",
  textMuted: "#8D6E63",
  surface: "#12100E",          
  surfacePressed: "#1A1715",   
  accent: "#6D4C41",
  accentLight: "#5D4037",
  star: "#8D6E63",
  navbarBg: "#12100E",
  navbarBorder: "transparent",
  iconInactive: "#8D6E63",
  iconActive: "#FFFFFF",
  pageGradientTopLeft: "#12100E",
  pageGradientMid: "#12100E",
  pageGradientBottomRight: "#12100E",
  pillUnselectedBg: "#12100E",
  coffeeTypeUnselectedBg: "#1F1C1A",
  coffeeTypeUnselectedText: "#EAE3DB",
  coffeeTypeUnselectedBorder: "rgba(234,227,219,0.1)",
  tasteSelectedGradientStart: "#8D6E63",
  tasteSelectedGradientEnd: "#6D4C41",
  actionText: "#EAE3DB",
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
    backgroundColor: colors.bg,
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
