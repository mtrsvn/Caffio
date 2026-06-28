import { useNavigation } from "@react-navigation/native";
import {
    Award,
    Coffee,
    Heart,
    LogOut,
    Mail,
    MapPin,
    Star,
    Store,
    Tag,
    TrendingUp,
    User,
    X,
    Edit2
} from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import achievementsData from "../data/achievements.json";

const ICON_MAP: Record<string, React.FC<any>> = {
  Award,
  Coffee,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Star,
  Store,
  Tag,
  TrendingUp,
  User,
  X,
};
import {
    Animated,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { removeUserAvatar, uploadUserAvatar, getCoffeeLogs, logout } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import { ThemeColors, getNeu } from "../components/colors";
import { useThemeStyles, useTheme } from "../components/ThemeContext";
import { LogEntry } from "../components/logCard";
import EditProfileSheet from "../components/editProfileSheet";



const BASE_TABBAR_HEIGHT = 66;

interface Props {
  refreshFlag?: number;
}

const ProfileHeader: React.FC<{ tasteProfile: { tag: string; count: number }[], onEditProfilePress: () => void }> = ({ tasteProfile, onEditProfilePress }) => {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useContext(AuthContext);
  const { colors } = useTheme();
  const styles = useThemeStyles(getStyles);
  const [createPressed, setCreatePressed] = useState(false);
  const [loginPressed, setLoginPressed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarPress = () => {
    if (!user) return;
    const hasPhoto = !!user.photoUrl;
    const options: any = [
      { text: "Take a Photo", onPress: handleTakePhoto },
      { text: hasPhoto ? "Change Photo" : "Upload Photo", onPress: handleUploadPhoto },
      { text: "Cancel", style: "cancel" },
    ];
    if (hasPhoto) {
      options.splice(2, 0, { text: "Remove Photo", style: "destructive", onPress: handleRemovePhoto });
    }
    Alert.alert("Profile Photo", "Choose an action", options, { cancelable: true });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const localUri = result.assets[0].uri;
        await uploadUserAvatar(user!.uid, localUri);
        await refreshUser();
      }
    } catch (e) {
      console.error("Failed to take photo", e);
      Alert.alert("Error", "Something went wrong taking your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const localUri = result.assets[0].uri;
        await uploadUserAvatar(user!.uid, localUri);
        await refreshUser();
      }
    } catch (e) {
      console.error("Failed to upload avatar", e);
      Alert.alert("Upload Failed", "Something went wrong uploading your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingAvatar(true);
      await removeUserAvatar(user!.uid);
      await refreshUser();
    } catch (e) {
      console.error("Failed to remove avatar", e);
      Alert.alert("Remove Failed", "Something went wrong removing your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleAvatarPress} disabled={!user}>
          <View style={[styles.avatarWrap, { overflow: "hidden" }]}>
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.accent} />
            ) : user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} cachePolicy="memory-disk" />
            ) : (
              <User size={24} color={colors.accent} />
            )}
          </View>
        </TouchableOpacity>

        <View style={[styles.headerText, { flex: 1 }]}>
          <Text style={[styles.headerName, { color: "rgba(255,255,255,0.95)" }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: "rgba(255,255,255,0.8)" }]}
          >
            {subtitle}
          </Text>
        </View>

        {user && (
          <TouchableOpacity 
            style={styles.editProfileBtn} 
            onPress={onEditProfilePress}
            activeOpacity={0.85}
          >
            <Edit2 size={13} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Taste flavor chips inside the card */}
      {user && tasteProfile.length > 0 && (
        <>
          <View style={styles.headerDivider} />
          <Text style={styles.headerFlavorLabel}>Taste Profile</Text>
          <View style={styles.headerFlavorRow}>
            {tasteProfile.map(({ tag }, i) => (
              <View
                key={tag}
                style={[
                  styles.headerFlavorChip,
                  i === 0 && styles.headerFlavorChipTop,
                ]}
              >
                <Text
                  style={[
                    styles.headerFlavorChipText,
                    i === 0 && styles.headerFlavorChipTextTop,
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {!user ? (
        <>
          <View style={styles.headerDivider} />

          <View style={styles.headerCenter}>
            <Text
              style={[styles.headerBody, { color: "rgba(255,255,255,0.8)" }]}
            >
              Track your coffee journey and unlock achievements
            </Text>

            <Text
              style={[
                styles.headerActionText,
                { color: "rgba(255,255,255,0.9)", textAlign: "center" },
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
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.9)",
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
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.9)",
                }}
              >
                Login
              </Text>
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
};

type StatCardProps = {
  Icon: React.FC<any>;
  label: string;
  value?: string | number;
};

const StatCard: React.FC<StatCardProps> = ({ Icon, label, value = 0 }) => {
  const styles = useThemeStyles(getStyles);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Icon size={15} color="#fff" />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
};

type PrefCardProps = {
  label: string;
  value?: string;
  Icon: React.FC<any>;
};

const PrefCard: React.FC<PrefCardProps> = ({
  label,
  value = "None yet",
  Icon,
}) => {
  const styles = useThemeStyles(getStyles);
  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.prefWrapper}>
      <View style={styles.prefCardInner}>
        <View style={styles.prefBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefLabel}>{label}</Text>
            <Text style={styles.prefValue}>{value}</Text>
          </View>
          <View style={styles.prefBadge}>
            <Icon size={20} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProfileScreen: React.FC<Props> = ({ refreshFlag }) => {
  const { colors, isDark } = useTheme();
  const styles = useThemeStyles(getStyles);
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
    thisMonthSpend: 0,
  });
  const [prefs, setPrefs] = useState({
    favoriteCafe: "None yet",
    favoriteType: "None yet",
    topTaste: "None yet",
  });
  const [tasteProfile, setTasteProfile] = useState<{ tag: string; count: number }[]>([]);
  const [tasteCounts, setTasteCounts] = useState<Record<string, number>>({});
  const [avgRating, setAvgRating] = useState<number>(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(500)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const offsetRef = useRef<number>(0);
  const { user } = useContext(AuthContext);

  // stats loader, defined before any hook uses it
  const loadStats = React.useCallback(async () => {
    if (!user) {
      setStats({ coffees: 0, cafes: 0, favorites: 0, thisMonth: 0, thisMonthSpend: 0 });
      setPrefs({ favoriteCafe: "None yet", favoriteType: "None yet", topTaste: "None yet" });
      setTasteProfile([]);
      setTasteCounts({});
      setAvgRating(0);
      return;
    }
    try {
      const logs = (await getCoffeeLogs(user.uid)) as LogEntry[];
      const now = new Date();
      const coffees = logs.length;
      const cafes = new Set(logs.map((l) => l.cafe)).size;
      const favorites = logs.filter((l) => l.favorite).length;
      const thisMonthLogs = logs.filter((l) => {
        const d = l.createdAt;
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
      const thisMonthSpend = thisMonthLogs.reduce((acc, l) => acc + (l.price || 0), 0);
      setStats({ coffees, cafes, favorites, thisMonth: thisMonthLogs.length, thisMonthSpend });

      // compute preferences
      const topBy = <T extends string>(vals: T[]): string => {
        if (!vals.length) return "None yet";
        const freq = new Map<string, number>();
        vals.forEach((v) => {
          if (v) freq.set(v, (freq.get(v) ?? 0) + 1);
        });
        return (
          [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet"
        );
      };

      const favoriteCafe = topBy(logs.map((l) => l.cafe ?? ""));
      const favoriteType = topBy(logs.map((l) => (l as any).coffeeType ?? ""));
      const allTastes = logs.flatMap((l) =>
        Array.isArray((l as any).tasteProfile) ? (l as any).tasteProfile : [],
      );
      const topTaste = topBy(allTastes);

      setPrefs({ favoriteCafe, favoriteType, topTaste });

      // top 6 taste tags with counts
      const freq = new Map<string, number>();
      allTastes.forEach((t: string) => { if (t) freq.set(t, (freq.get(t) ?? 0) + 1); });
      const topTags = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag, count]) => ({ tag, count }));
      setTasteProfile(topTags);

      const freqObj: Record<string, number> = {};
      freq.forEach((v, k) => {
        freqObj[k] = v;
      });
      setTasteCounts(freqObj);

      // average rating
      const rated = logs.filter((l: any) => typeof l.rating === "number");
      const avg = rated.length ? rated.reduce((s: number, l: any) => s + l.rating, 0) / rated.length : 0;
      setAvgRating(Math.round(avg * 10) / 10);
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
      setStats({ coffees: 0, cafes: 0, favorites: 0, thisMonth: 0, thisMonthSpend: 0 });
      setPrefs({ favoriteCafe: "None yet", favoriteType: "None yet", topTaste: "None yet" });
      setTasteProfile([]);
      setAvgRating(0);
    }
  }, [user, loadStats, refreshFlag]);

  return (
    <View style={styles.screenContainer}>
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
              tintColor={colors.gradientStart}
              colors={[colors.gradientStart]}
            />
          }
        >
          <ProfileHeader tasteProfile={tasteProfile} onEditProfilePress={() => setEditProfileVisible(true)} />

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
              label="Spend This Month"
              value={`${stats.thisMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
          </View>

          {/* ── Achievements ───────────────────────────────── */}
          {user && (() => {
            const ALL = achievementsData.map((ach) => {
              const IconComponent = ICON_MAP[ach.icon] ?? Coffee;
              let earned = false;
              if (ach.metric === "coffees") earned = stats.coffees >= ach.value;
              else if (ach.metric === "cafes") earned = stats.cafes >= ach.value;
              else if (ach.metric === "favorites") earned = stats.favorites >= ach.value;
              else if (ach.metric === "thisMonth") earned = stats.thisMonth >= ach.value;
              else if (ach.metric === "avgRating") earned = avgRating >= ach.value;
              else if (ach.metric.startsWith("taste_")) {
                const tag = ach.metric.substring(6);
                earned = (tasteCounts[tag] ?? 0) >= ach.value;
              } else if (ach.metric === "uniqueTastes") {
                earned = Object.keys(tasteCounts).length >= ach.value;
              }

              return {
                icon: IconComponent,
                label: ach.label,
                hint: ach.hint,
                earned,
              };
            });
            const earned = ALL.filter(a => a.earned);

            const openSheet = () => {
              setShowAchievements(true);
              sheetAnim.setValue(500);
              backdropAnim.setValue(0);
              Animated.parallel([
                Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(sheetAnim,   { toValue: 0,   duration: 300, useNativeDriver: true }),
              ]).start();
            };

            const closeSheet = () => {
              Animated.parallel([
                Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
                Animated.timing(sheetAnim,   { toValue: 500, duration: 240, useNativeDriver: true }),
              ]).start(() => setShowAchievements(false));
            };

            return (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.coffeeTypeUnselectedText }]}>Achievements</Text>
                  <TouchableOpacity onPress={openSheet} activeOpacity={0.8}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {earned.length > 0 ? (
                  <View style={styles.achievementsCard}>
                    {earned.slice(0, 6).map(({ icon: Icon, label }) => (
                      <View key={label} style={styles.badge}>
                        <View style={styles.badgeIcon}>
                          <Icon size={11} color="#fff" />
                        </View>
                        <Text style={styles.badgeLabel} numberOfLines={1} ellipsizeMode="tail">
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.achievementsCard}>
                    <Text style={styles.noAchievText}>Start logging coffees to earn badges!</Text>
                  </View>
                )}

                {/* ── All Achievements Modal ─────────────────── */}
                <Modal visible={showAchievements} transparent animationType="none" onRequestClose={closeSheet}>
                  <View style={{ flex: 1 }}>
                    {/* backdrop */}
                    <Animated.View
                      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropAnim }]}
                    >
                      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet} />
                    </Animated.View>

                    {/* sheet */}
                    <Animated.View style={[styles.achSheet, { transform: [{ translateY: sheetAnim }] }]}>
                      <View style={styles.achSheetHandle} />
                      <View style={styles.achSheetHeader}>
                        <Text style={styles.achSheetTitle}>All Achievements</Text>
                        <TouchableOpacity onPress={closeSheet} style={styles.achCloseBtn} activeOpacity={0.8}>
                          <X size={17} color={colors.textMuted} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.achievementSheetList}>
                        {ALL.map(({ icon: Icon, label, hint, earned: e }) => (
                          <View key={label} style={[styles.achRow, !e && styles.achRowDim]}>
                            <View style={[styles.achRowIcon, !e && styles.achRowIconDim]}>
                              <Icon size={16} color={e ? "#fff" : colors.textMuted} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.achRowLabel, !e && styles.achRowLabelDim]}>{label}</Text>
                              <Text style={styles.achRowHint}>{e ? "✓ Earned" : hint}</Text>
                            </View>
                            {e && <View style={styles.achRowDot} />}
                          </View>
                        ))}
                      </ScrollView>
                    </Animated.View>
                  </View>
                </Modal>
              </>
            );
          })()}

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.coffeeTypeUnselectedText }]}>
              Your Preferences
            </Text>
          </View>

          <PrefCard
            label="Favorite Cafe"
            value={prefs.favoriteCafe}
            Icon={Store}
          />
          <PrefCard
            label="Favorite Type"
            value={prefs.favoriteType}
            Icon={Coffee}
          />
          <PrefCard label="Top Taste" value={prefs.topTaste} Icon={Tag} />


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
        <EditProfileSheet 
          visible={editProfileVisible}
          onClose={() => setEditProfileVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const getStyles = (colors: ThemeColors, isDark?: boolean) => {
  const neu = getNeu(colors, isDark || false);
  return StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Profile header card ──────────────────────────────────────────
  headerCard: {
    ...neu.raised,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.accent,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.75 },

  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 10,
  },
  headerCenter: { alignItems: "center", paddingBottom: 4 },
  headerBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 8,
    marginBottom: 8,
    opacity: 0.85,
  },
  headerAction: {
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  headerActionText: { fontWeight: "700", fontSize: 14 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...neu.raised,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },

  // ── Pref cards ───────────────────────────────────────────────────
  prefWrapper: {
    marginBottom: 10,
  },
  prefCardInner: {
    borderRadius: 18,
    ...neu.raised,
  },
  prefBody: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  prefLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.3, fontWeight: "500" },
  prefValue: { fontSize: 16, fontWeight: "700", marginTop: 4, color: colors.textPrimary },
  prefBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginLeft: 16,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // ── Logout ───────────────────────────────────────────────────────
  logoutButton: {
    ...neu.raised,
    marginTop: 8,
    borderRadius: 18,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  logoutButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
  logoutIcon: { marginRight: 10 },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },

  // ── Achievements ─────────────────────────────────────────────────
  achievementsCard: {
    ...neu.raised,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 8,
    columnGap: "2.3%",
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 7,
    width: "31.8%",
  },
  badgeDim: {
    backgroundColor: colors.surfacePressed,
  },
  badgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeIconDim: {
    backgroundColor: colors.coffeeTypeUnselectedBorder,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.1,
    flex: 1,
  },
  badgeLabelDim: {
    color: colors.textMuted,
  },

  // ── Taste chips inside header card ──────────────────────────────
  headerFlavorLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  headerFlavorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  headerFlavorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginLeft: 10,
  },
  editProfileBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerFlavorChipTop: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  headerFlavorChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "capitalize",
  },
  headerFlavorChipTextTop: {
    color: "#fff",
    fontWeight: "700",
  },
  headerFlavorChipCount: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  headerFlavorChipCountTop: {
    color: "rgba(255,255,255,0.75)",
  },

  // ── Account Info ──────────────────────────────────────────────────
  accountCard: {
    ...neu.raised,
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  accountIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  accountDivider: {
    height: 1,
    backgroundColor: colors.surfacePressed,
    marginHorizontal: 16,
  },

  // ── Section row (title + view all) ───────────────────────────────
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 14,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.3,
  },
  noAchievText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // ── Achievement bottom sheet ──────────────────────────────────────
  achSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: "75%",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.8 : 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  achSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.coffeeTypeUnselectedBorder,
    alignSelf: "center",
    marginBottom: 14,
  },
  achSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  achievementSheetList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  achSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  achCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfacePressed,
    alignItems: "center",
    justifyContent: "center",
  },
  achRow: {
    ...neu.raised,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  achRowDim: {
    opacity: 0.55,
  },
  achRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  achRowIconDim: {
    backgroundColor: colors.coffeeTypeUnselectedBorder,
  },
  achRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  achRowLabelDim: {
    color: colors.textMuted,
  },
  achRowHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  achRowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
});
};

export default ProfileScreen;
