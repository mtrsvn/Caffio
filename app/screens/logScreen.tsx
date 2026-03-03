import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoffeeLogs } from "../../firebaseconfig";
import { AuthContext } from "../components/AuthProvider";
import colors from "../components/colors";
import EditLogSheet from "../components/editLogSheet";
import LogCard, { LogEntry } from "../components/logCard";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const BASE_TABBAR_HEIGHT = 66;

interface Props {
  refreshFlag?: number;
}

const LogScreen: React.FC<Props> = ({ refreshFlag = 0 }) => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [firstRun, setFirstRun] = useState(true);

  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  // showSpinner: whether to toggle the refreshing indicator (only for manual pull-to-refresh)
  const fetchLogs = async (showSpinner = true) => {
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
      setLogs(fetched);
    } catch (err: any) {
      console.error("[LogScreen] failed to load logs", err);
      alert(
        `Unable to load logs: ${err?.message || err?.toString() || "unknown"}`,
      );
    } finally {
      if (showSpinner) setRefreshing(false);
      setFirstRun(false);
    }
  };

  useEffect(() => {
    // initial load without showing loader
    fetchLogs(false);
  }, [user, refreshFlag]);

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 18 }]}>
        <Text style={styles.title}>Your Coffee Logs</Text>
        <Text style={styles.subtitle}>
          Track and review your coffee experiences
        </Text>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom ?? 0 }]}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
          )}
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
              <View style={styles.emptyState}>
                {refreshing ? (
                  <ActivityIndicator
                    size="large"
                    color={colors.gradientStart}
                  />
                ) : (
                  <Text style={styles.emptyText}>
                    {user ? "No logs yet" : "Log in to view your entries"}
                  </Text>
                )}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6D4C41",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  emptyText: {
    color: colors.iconInactive,
    marginTop: 6,
  },
});

export default LogScreen;
