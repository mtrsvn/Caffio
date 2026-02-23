import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
    Coffee,
    Heart,
    LogOut,
    MapPin,
    TrendingUp,
    User,
} from "lucide-react-native";
import React, { useContext, useRef, useState } from "react";
import {
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoffeeLogs, logout } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

interface Props {
  refreshFlag?: number;
}

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
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [createPressed, setCreatePressed] = useState(false);
  const [loginPressed, setLoginPressed] = useState(false);

  const displayName =
    user?.username || (user?.email ? user.email.split("@")[0] : "Guest");
  const subtitle = user
    ? user.createdAt
      ? `Member since ${user.createdAt.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}`
      : "Member"
    : "Not logged in";

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
          <Text style={[styles.headerName, { color: colors.pillUnselectedBg }]}>
            {displayName}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.pillUnselectedBg }]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {!user ? (
        <>
          <View style={styles.headerDivider} />

          <View style={styles.headerCenter}>
            <Text
              style={[styles.headerBody, { color: colors.pillUnselectedBg }]}
            >
              Track your coffee journey and unlock achievements
            </Text>

            <Text
              style={[
                styles.headerActionText,
                { color: colors.pillUnselectedBg, textAlign: "center" },
              ]}
            >
              <Text
                onPress={() => navigation.navigate("Register")}
                onPressIn={() => setCreatePressed(true)}
                onPressOut={() => setCreatePressed(false)}
                suppressHighlighting={true}
                style={{
                  fontWeight: "700",
                  color: createPressed
                    ? colors.gradientEnd
                    : colors.pillUnselectedBg,
                }}
              >
                Create an Account
              </Text>
              <Text style={{ fontWeight: "400" }}> or </Text>
              <Text
                onPress={() => navigation.navigate("Login")}
                onPressIn={() => setLoginPressed(true)}
                onPressOut={() => setLoginPressed(false)}
                suppressHighlighting={true}
                style={{
                  fontWeight: "700",
                  color: loginPressed
                    ? colors.gradientEnd
                    : colors.pillUnselectedBg,
                }}
              >
                Login
              </Text>
            </Text>
          </View>
        </>
      ) : null}
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

const ProfileScreen: React.FC<Props> = ({ refreshFlag = 0 }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    coffees: 0,
    cafes: 0,
    favorites: 0,
    thisMonth: 0,
  });
  const scrollRef = useRef<any>(null);
  const offsetRef = useRef<number>(0);
  const { user } = useContext(AuthContext);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // refresh both stats and whatever else is needed
    await loadStats();
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const loadStats = React.useCallback(async () => {
    if (!user) {
      setStats({ coffees: 0, cafes: 0, favorites: 0, thisMonth: 0 });
      return;
    }
    try {
      const logs = await getCoffeeLogs(user.uid);
      const now = new Date();
      const coffees = logs.length;
      const cafes = new Set(logs.map((l) => l.cafe)).size;
      const favorites = logs.filter((l) => l.favorite).length;
      const thisMonth = logs.filter((l) => {
        const d = l.createdAt;
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length;
      setStats({ coffees, cafes, favorites, thisMonth });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[ProfileScreen] loadStats failed", e);
    }
  }, [user]);

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          ref={scrollRef}
          onScroll={({ nativeEvent }) => {
            offsetRef.current = nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: (insets.bottom ?? 12) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#000"
              colors={["#000"]}
            />
          }
        >
          <ProfileHeader />

          <View style={styles.statsGrid}>
            <StatCard
              Icon={Coffee}
              label="Coffees Tried"
              value={stats.coffees}
            />
            <StatCard Icon={MapPin} label="Cafes Visited" value={stats.cafes} />
            <StatCard Icon={Heart} label="Favorites" value={stats.favorites} />
            <StatCard
              Icon={TrendingUp}
              label="This Month"
              value={stats.thisMonth}
            />
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

          {user ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={async () => {
                try {
                  await logout();
                  // after logout, scroll to top so guest header is visible
                  setTimeout(() => {
                    if (
                      scrollRef.current &&
                      typeof scrollRef.current.scrollTo === "function"
                    ) {
                      scrollRef.current.scrollTo({ y: 0, animated: true });
                    }
                  }, 50);
                } catch (e) {
                  // ignore
                }
              }}
              style={styles.logoutButton}
            >
              <View style={styles.logoutContent}>
                <LogOut
                  size={18}
                  color={colors.actionText}
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>
          ) : null}

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
  logoutButton: {
    marginTop: 8,
    borderRadius: 12,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: colors.navbarBg,
    borderWidth: 0.6,
    borderColor: colors.navbarBorder,
    marginBottom: 14,
  },
  logoutButtonText: {
    color: colors.actionText,
    fontWeight: "700",
    marginLeft: 0,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});

export default ProfileScreen;
