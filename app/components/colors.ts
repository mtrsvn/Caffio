// Caffio — Neumorphism Design System
const colors = {
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

// ── Neumorphic shadow helpers ────────────────────────────────────────
export const neu = {
  /** Raised element — casts shadows outward */
  raised: {
    shadowColor: "#C8BEB4",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: "#EDE8E2",
  },
  /** Pressed / inset element */
  pressed: {
    shadowColor: "#C8BEB4",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
    backgroundColor: "#E4DED7",
  },
  /** Flat — no shadow, matches bg */
  flat: {
    backgroundColor: "#EDE8E2",
  },
};

export default colors;
