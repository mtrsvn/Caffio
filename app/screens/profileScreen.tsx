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
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getCoffeeLogs, logout } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
import { LogEntry } from "../components/logCard";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const BASE_TABBAR_HEIGHT = 66;

interface Props {
  refreshFlag?: number;
}

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
          backgroundColor: colors.navbarBg,
          borderColor: colors.navbarBorder,
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

type PrefCardProps = {
  label: string;
  value?: string;
};

const PrefCard: React.FC<PrefCardProps> = ({ label, value = "None yet" }) => {
  return (
    <TouchableOpacity activeOpacity={0.95} style={styles.prefWrapper}>
      <View
        style={[
          styles.prefCardInner,
          {
            backgroundColor: colors.navbarBg,
            borderColor: colors.navbarBorder,
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

const ProfileScreen: React.FC<Props> = ({ refreshFlag = 0 }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
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

  // stats loader, defined before any hook uses it
  const loadStats = React.useCallback(async () => {
    if (!user) {
      setStats({ coffees: 0, cafes: 0, favorites: 0, thisMonth: 0 });
      return;
    }
    try {
      const logs = (await getCoffeeLogs(user.uid)) as LogEntry[];
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
      console.error("[ProfileScreen] loadStats failed", e);
    }
  }, [user]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);

    await loadStats();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadStats]);

  // reload stats when user changes (e.g. after login/logout)
  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setStats({ coffees: 0, cafes: 0, favorites: 0, thisMonth: 0 });
    }
  }, [user, loadStats]);

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          ref={scrollRef}
          onScroll={({ nativeEvent }) => {
            offsetRef.current = nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: tabBarHeight + 16 },
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

                  setTimeout(() => {
                    if (
                      scrollRef.current &&
                      typeof scrollRef.current.scrollTo === "function"
                    ) {
                      scrollRef.current.scrollTo({ y: 0, animated: true });
                    }
                  }, 50);
                } catch (e) {}
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

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  safe: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  headerCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,

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
    marginVertical: 8,
  },

  headerCenter: {
    alignItems: "center",

    paddingBottom: 4,
  },

  headerBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 8,
    marginBottom: 6,
  },

  headerAction: {
    paddingTop: 1,
    paddingBottom: 0,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  headerActionText: {
    fontWeight: "700",
    fontSize: 14,
  },

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

  prefWrapper: {
    marginBottom: 14,

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
    overflow: "hidden",
    borderWidth: 0.6,
  },
  prefBody: {
    paddingHorizontal: 14,
    paddingVertical: 22,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

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
