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



const BASE_TABBAR_HEIGHT = 66;

import { GlobalContext } from "../components/navigation";

interface Props {}

const LogScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { refreshLogsFlag } = useContext(GlobalContext);
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
  }, [user, refreshLogsFlag]);

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
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#EDE8E2" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.accentLight,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 6,
  },
});

export default LogScreen;
