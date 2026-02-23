import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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

interface Props {
  refreshFlag?: number;
}

const LogScreen: React.FC<Props> = ({ refreshFlag = 0 }) => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  const fetchLogs = async () => {
    if (!user) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      // debug
      // eslint-disable-next-line no-console
      console.log("[LogScreen] fetching logs for uid", user.uid);
      const fetched = await getCoffeeLogs(user.uid);
      setLogs(fetched);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[LogScreen] failed to load logs", err);
      alert(
        `Unable to load logs: ${err?.message || err?.toString() || "unknown"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
        {loading ? (
          <ActivityIndicator size="large" color={colors.gradientStart} />
        ) : logs.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: colors.iconInactive }}>
              {user ? "No logs yet" : "Log in to view your entries"}
            </Text>
          </View>
        ) : (
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
              />
            )}
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          />
        )}
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
});

export default LogScreen;
