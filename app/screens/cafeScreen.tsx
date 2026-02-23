

import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CafeCard from "../components/cafeCards";
import colors from "../components/colors";
import { fetchNearbyCafes, SimplePlace } from "../utils/places";

const PAGE_GRADIENT = [
  colors.pageGradientTopLeft,
  colors.pageGradientMid,
  colors.pageGradientBottomRight,
] as readonly string[];

const DEFAULT_RADIUS = 5000; 
const BASE_TABBAR_HEIGHT = 66;

type PlaceUI = SimplePlace & {
  id: string;
  distanceKm: number;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  openNow?: boolean;
};

export default function CafeScreen() {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceUI[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  
  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
  const footerSpacing = tabBarHeight + 16; 

  const filteredPlaces = useMemo(() => {
    if (!searchQuery) return places;
    const q = searchQuery.toLowerCase();
    return places.filter((p) => p.name.toLowerCase().includes(q));
  }, [places, searchQuery]);

  const load = useCallback(async (radius = DEFAULT_RADIUS) => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setPlaces([]);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const results: SimplePlace[] = await fetchNearbyCafes(lat, lng, radius);

      const mapped: PlaceUI[] = results.map((p: SimplePlace, idx: number) => {
        const placeLat = p.lat;
        const placeLng = p.lng;
        const distMeters = getDistance(
          { latitude: lat, longitude: lng },
          { latitude: placeLat, longitude: placeLng },
        );
        const distanceKm = distMeters / 1000;

        const baseId =
          (p as any).place_id ??
          (p as any).id ??
          p.id ??
          `geo:${placeLat}:${placeLng}`;
        const uniqueId = `${String(baseId)}-${idx}`;

        const rating =
          (p as any).rating ??
          (p.raw && p.raw.tags && (p.raw.tags["rating"] ?? undefined)) ??
          undefined;
        const totalRatings =
          (p as any).user_ratings_total ??
          (p.raw && p.raw.tags && (p.raw.tags["reviews"] ?? undefined)) ??
          undefined;
        const openNow = (p as any).opening_hours?.open_now ?? undefined;

        return {
          ...p,
          id: uniqueId,
          name: p.name ?? "Unknown",
          distanceKm,
          lat: placeLat,
          lng: placeLng,
          rating,
          totalRatings,
          openNow,
        } as PlaceUI;
      });

      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
      setPlaces(mapped);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg.includes("Geoapify") ? `Server error: ${msg}` : msg);
      setPlaces([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const Header = (
    <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 18 }]}>
      <Text style={styles.title}>Nearby Cafes</Text>
      <Text style={styles.subtitle}>Discover coffee shops around you</Text>
    </View>
  );

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.centerContent}>
        <Text style={styles.emptyText}>No cafes found nearby</Text>
      </View>
    );
  };

  
  const SearchBar = (
    <View style={styles.searchContainerWrapper}>
      <View style={styles.searchInner}>
        <Search size={16} color={colors.gradientEnd} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cafes..."
          placeholderTextColor="rgba(78,52,46,0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          selectionColor={colors.gradientEnd}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      {Header}
      {}
      <View style={{ paddingHorizontal: 16 }}>{SearchBar}</View>

      {}
      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }: ListRenderItemInfo<PlaceUI>) => (
          <CafeCard
            key={String(item.id)}
            name={item.name}
            address={item.address}
            onPress={() => {
              console.log("pressed", item.name, item.lat, item.lng);
            }}
          />
        )}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            
            tintColor="#000"
            colors={["#000"]}
          />
        }
        
        contentContainerStyle={{
          paddingBottom: footerSpacing,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        contentInset={{ bottom: tabBarHeight }}
        ListFooterComponent={<View style={{ height: tabBarHeight }} />}
      />
    </LinearGradient>
  );
}

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
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#666" },
  errorText: { color: "#b71c1c" },

  
  searchContainerWrapper: {
    marginBottom: 12,
    
    backgroundColor: "transparent",
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.gradientEnd,
  },
});
