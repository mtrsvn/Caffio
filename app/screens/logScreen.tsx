import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoffeeLogs, deleteCoffeeLog } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import { ThemeColors } from "../components/colors";
import { useThemeStyles, useTheme } from "../components/ThemeContext";
import EditLogSheet from "../components/editLogSheet";
import LogCard, { LogEntry } from "../components/logCard";
import CustomCalendar from "../components/calendar";

const BASE_TABBAR_HEIGHT = 66;

interface Props {
  refreshFlag?: number;
}

const LogScreen: React.FC<Props> = ({ refreshFlag }) => {
  const { colors } = useTheme();
  const styles = useThemeStyles(getStyles);
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [firstRun, setFirstRun] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  const fetchLogs = useCallback(async (showSpinner = true) => {
    if (!user) {
      setLogs([]);
      if (showSpinner) setRefreshing(false);
      setFirstRun(false);
      return;
    }
    if (showSpinner) setRefreshing(true);
    try {
      console.log("[LogScreen] fetching logs for uid", user.uid);
      const fetched = (await getCoffeeLogs(user.uid)) as LogEntry[];
      
      const dummyLogs = fetched.filter(log => log.id.startsWith("dummy-"));
      if (dummyLogs.length > 0) {
        console.log("[LogScreen] Cleaning up dummy logs...", dummyLogs.length);
        for (const dl of dummyLogs) {
          await deleteCoffeeLog(user.uid, dl.id);
        }
        const cleaned = (await getCoffeeLogs(user.uid)) as LogEntry[];
        setLogs(cleaned);
      } else {
        setLogs(fetched);
      }
    } catch (err: any) {
      console.error("[LogScreen] failed to load logs", err);
      alert(
        `Unable to load logs: ${err?.message || err?.toString() || "unknown"}`,
      );
    } finally {
      if (showSpinner) setRefreshing(false);
      setFirstRun(false);
    }
  }, [user]);

  useEffect(() => {
    // initial load without showing loader
    fetchLogs(false);
  }, [fetchLogs, refreshFlag]);

  const filteredLogs = React.useMemo(() => {
    // "logs not toggled date" -> don't filter logs based on selected date
    return logs;
  }, [logs, selectedDate]);

  const loggedDates = React.useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dates.add(key);
    });
    return dates;
  }, [logs]);

  const handleDateSelect = (date: Date) => {
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const renderLogItem = useCallback(({ item }: { item: LogEntry }) => (
    <LogCard
      entry={item}
      onPress={() => {
        setEditingEntry(item);
        setEditVisible(true);
      }}
      onToggleFavorite={(newVal) => {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === item.id ? { ...l, favorite: newVal } : l,
          ),
        );
      }}
    />
  ), []);


  return (
    <View style={styles.screenContainer}>
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 8 }]}>
        <Text style={styles.title}>Your Coffee Logs</Text>
        <Text style={styles.subtitle}>
          Track and review your coffee experiences
        </Text>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom ?? 0 }]}>
        <FlatList
          ListHeaderComponent={
            <View style={styles.calendarContainer}>
              <CustomCalendar
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                loggedDates={loggedDates}
              />
            </View>
          }
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLogs(true)}
              tintColor={colors.gradientStart}
              colors={[colors.gradientStart]}
            />
          }
          ListEmptyComponent={() => {
            if (firstRun) {
              // don't render anything while the initial load is in progress
              return null;
            }
            return (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {!user 
                    ? "Log in to view your entries" 
                    : selectedDate 
                      ? "No logs for this day" 
                      : "No logs yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {!user 
                    ? "Sign in to track your coffee journey" 
                    : selectedDate 
                      ? "Try selecting another date or add a new entry!" 
                      : "Tap the + button to log your first coffee!"}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 8,
            paddingBottom: tabBarHeight + 16,
          }}
        />
      </View>

      {editingEntry && (
        <EditLogSheet
          visible={editVisible}
          onClose={() => {
            setEditVisible(false);
          }}
          onExited={() => {
            setEditingEntry(null);
          }}
          entry={editingEntry}
          onSaved={(updated) => {
            setLogs((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l)),
            );
            setEditingEntry(null);
          }}
          onDeleted={() => {
            setLogs((prev) => prev.filter((l) => l.id !== editingEntry.id));
            setEditingEntry(null);
          }}
        />
      )}
    </View>
  );
};

const getStyles = (colors: ThemeColors, isDark?: boolean) => StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.coffeeTypeUnselectedText,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  calendarContainer: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? "#000" : colors.shadowDark,
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 6, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
});

export default LogScreen;
