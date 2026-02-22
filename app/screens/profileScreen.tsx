import { LinearGradient } from "expo-linear-gradient";
import { Coffee, Heart, MapPin, TrendingUp, User } from "lucide-react-native";
import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../components/colors";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

/**
 * Profile screen
 *
 * - Header uses gradientStart / gradientEnd
 * - Stat cards use navbarBg / navbarBorder for card look
 * - Preference cards use same card wrapper/card properties as CafeCard (shadow on wrapper,
 *   overflow: 'hidden' card, borderWidth 0.6, paddingHorizontal 14 / paddingVertical 25)
 * - Icon circles and numeric badges use gradientStart/gradientEnd
 * - Text colors follow tokens supplied in colors.ts
 */

/* ---------------------------
   Reusable components
   --------------------------- */

const ProfileHeader: React.FC = () => {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.headerCard}
    >
      <View style={styles.headerTop}>
        <View style={styles.avatarWrap}>
          <User size={28} color={colors.gradientStart} />
        </View>

        <View style={styles.headerText}>
          {/* Guest text color requested as pillUnselectedBg */}
          <Text style={[styles.headerName, { color: colors.pillUnselectedBg }]}>
            Guest
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.pillUnselectedBg }]}
          >
            Not logged in
          </Text>
        </View>
      </View>

      <View style={styles.headerDivider} />

      {/* Centered container for the body text and CTA */}
      <View style={styles.headerCenter}>
        <Text style={[styles.headerBody, { color: colors.pillUnselectedBg }]}>
          Track your coffee journey and unlock achievements
        </Text>

        <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
          <Text
            style={[
              styles.headerActionText,
              { color: colors.pillUnselectedBg },
            ]}
          >
            Create an account or login
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

type StatCardProps = {
  Icon: React.FC<any>;
  label: string;
  value?: string | number;
};

const StatCard: React.FC<StatCardProps> = ({ Icon, label, value = 0 }) => {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.navbarBg, // card color same as navbarBg
          borderColor: colors.navbarBorder, // border color from navbarBorder
        },
      ]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.statIconWrap}
      >
        <Icon size={18} color={colors.iconActive} />
      </LinearGradient>

      <Text style={[styles.statValue, { color: colors.iconInactive }]}>
        {value}
      </Text>
      <Text
        style={[styles.statLabel, { color: colors.coffeeTypeUnselectedText }]}
      >
        {label}
      </Text>
    </View>
  );
};

/* Preference card reimplemented to match CafeCard wrapper/card style */
type PrefCardProps = {
  label: string;
  value?: string;
};

const PrefCard: React.FC<PrefCardProps> = ({ label, value = "None yet" }) => {
  // wrapper provides the shadow (keeps overflow hidden on card)
  return (
    <TouchableOpacity activeOpacity={0.95} style={styles.prefWrapper}>
      <View
        style={[
          styles.prefCardInner,
          {
            backgroundColor: colors.navbarBg, // same as cafe card background
            borderColor: colors.navbarBorder, // same border
          },
        ]}
      >
        <View style={styles.prefBody}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.prefLabel,
                { color: colors.coffeeTypeUnselectedText },
              ]}
            >
              {label}
            </Text>
            <Text style={[styles.prefValue, { color: colors.iconInactive }]}>
              {value}
            </Text>
          </View>

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.prefBadge}
          >
            <Text style={[styles.prefBadgeText, { color: colors.navbarBg }]}>
              0
            </Text>
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ---------------------------
   Screen
   --------------------------- */

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: (insets.bottom ?? 12) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader />

          <View style={styles.statsGrid}>
            <StatCard Icon={Coffee} label="Coffees Tried" value={0} />
            <StatCard Icon={MapPin} label="Cafes Visited" value={0} />
            <StatCard Icon={Heart} label="Favorites" value={0} />
            <StatCard Icon={TrendingUp} label="This Month" value={0} />
          </View>

          <Text
            style={[
              styles.sectionTitle,
              { color: colors.coffeeTypeUnselectedText },
            ]}
          >
            Your Preferences
          </Text>

          <PrefCard label="Favorite Cafe" />
          <PrefCard label="Favorite Type" />
          <PrefCard label="Top Taste" />

          <View style={{ height: 28 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

/* ---------------------------
   Styles
   --------------------------- */

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  safe: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Header */
  headerCard: {
    borderRadius: 14,
    padding: 12, // reduced from 16
    marginBottom: 12,
    // use same shadow as cafeCard.wrapper
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navbarBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerText: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 8, // reduced spacing
  },

  /* Center container to horizontally center the two lines and CTA */
  headerCenter: {
    alignItems: "center",
    // reduce vertical spacing so it sits closer to header
    paddingBottom: 4,
  },

  headerBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center", // centered
    marginHorizontal: 8, // slightly reduce side padding
    marginBottom: 6, // small spacing to CTA
  },

  headerAction: {
    // Make CTA even more compact
    paddingTop: 1,
    paddingBottom: 0,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  headerActionText: {
    fontWeight: "700",
    fontSize: 14, // reduce font size
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statCard: {
    width: "48%",
    minHeight: 112,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    justifyContent: "flex-start",
    // apply same shadow as cafeCard.wrapper
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
    marginBottom: 10,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 6,
  },

  /* Preferences: wrapper + inner card (matches CafeCard) */
  prefWrapper: {
    marginBottom: 14,
    // subtle cross-platform shadow (matches CafeCard wrapper)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  prefCardInner: {
    borderRadius: 12,
    overflow: "hidden", // keep rounded corners for inner content (same as CafeCard.card)
    borderWidth: 0.6,
  },
  prefBody: {
    paddingHorizontal: 14,
    paddingVertical: 22, // slightly reduced
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

  /* Preference text + badge */
  prefLabel: { fontSize: 12 },
  prefValue: { fontSize: 16, fontWeight: "700", marginTop: 6 },

  prefBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  prefBadgeText: {
    fontWeight: "700",
    fontSize: 16,
  },

  /* Misc */
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
});

export default ProfileScreen;
