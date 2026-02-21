import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CafeCard from "../components/cafeCards";
import {
  fetchNearbyCafes,
  getImageForPlace,
  SimplePlace,
} from "../utils/places";

const PAGE_GRADIENT = ["#EFEBE9", "#F5F5F5", "#D7CCC8"] as readonly string[];
const DEFAULT_RADIUS = 3000; // meters
const IMAGE_RESOLVE_LIMIT = 20;

type PlaceUI = SimplePlace & {
  id: string;
  distanceKm: number;
  photoUrl: string;
  lat: number;
  lng: number;
  // optional fields from various providers
  rating?: number;
  totalRatings?: number;
  openNow?: boolean;
};

export default function CafeScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [places, setPlaces] = useState<PlaceUI[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debug state
  const [lastLatLng, setLastLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rawCount, setRawCount] = useState<number | null>(null);
  const [rawSample, setRawSample] = useState<any | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [radiusInput, setRadiusInput] = useState(String(DEFAULT_RADIUS));

  const load = useCallback(
    async (isRefresh = false, overrideRadius?: number) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      setRawError(null);
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
        setLastLatLng({ lat, lng });

        const r =
          typeof overrideRadius === "number"
            ? overrideRadius
            : Number(radiusInput) || DEFAULT_RADIUS;

        // call Overpass helper
        const results: SimplePlace[] = await fetchNearbyCafes(lat, lng, r);

        // Debug: count and sample raw
        setRawCount(results.length);
        setRawSample(results.length ? (results[0].raw ?? results[0]) : null);

        // Map results to UI model and compute distance
        const mapped: PlaceUI[] = results.map((p: SimplePlace, idx: number) => {
          const placeLat = p.geometry?.location?.lat ?? p.lat ?? 0;
          const placeLng = p.geometry?.location?.lng ?? p.lng ?? 0;
          const distMeters = getDistance(
            { latitude: lat, longitude: lng },
            { latitude: placeLat, longitude: placeLng },
          );
          const distanceKm = distMeters / 1000;

          const baseId =
            (p as any).place_id ??
            (p as any).id ??
            p.id ??
            `osm:${placeLat}:${placeLng}`;
          const uniqueId = `${String(baseId)}-${idx}`;

          // Pull provider-specific fields defensively
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
            photoUrl: p.photoUrl ?? "",
            lat: placeLat,
            lng: placeLng,
            rating,
            totalRatings,
            openNow,
          } as PlaceUI;
        });

        mapped.sort((a, b) => a.distanceKm - b.distanceKm);
        setPlaces(mapped);

        // Resolve images for top N
        const toResolve = mapped.slice(0, IMAGE_RESOLVE_LIMIT);
        await Promise.all(
          toResolve.map(async (p) => {
            try {
              const url = await getImageForPlace(p, 800);
              setPlaces((prev) => {
                const idx = prev.findIndex((x) => x.id === p.id);
                if (idx === -1) return prev;
                const copy = prev.slice();
                copy[idx] = { ...copy[idx], photoUrl: url };
                return copy;
              });
            } catch {
              // ignore image errors
            }
          }),
        );
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        setRawError(msg);
        setError(msg.includes("Overpass") ? `Server error: ${msg}` : msg);
        setPlaces([]);
        setRawCount(0);
        setRawSample(null);
      } finally {
        setLoading(false);
      }
    },
    [radiusInput],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const testWithCoords = useCallback(async () => {
    const testLat = 14.5995;
    const testLng = 120.9842;
    const r = Number(radiusInput) || DEFAULT_RADIUS;
    setLastLatLng({ lat: testLat, lng: testLng });
    setLoading(true);
    setError(null);
    setRawError(null);
    try {
      const results = await fetchNearbyCafes(testLat, testLng, r);
      setRawCount(results.length);
      setRawSample(results.length ? (results[0].raw ?? results[0]) : null);

      const mapped: PlaceUI[] = results.map((p: SimplePlace, idx: number) => {
        const placeLat = p.geometry?.location?.lat ?? p.lat ?? 0;
        const placeLng = p.geometry?.location?.lng ?? p.lng ?? 0;
        const distMeters = getDistance(
          { latitude: testLat, longitude: testLng },
          { latitude: placeLat, longitude: placeLng },
        );
        const distanceKm = distMeters / 1000;
        const baseId =
          (p as any).place_id ??
          (p as any).id ??
          p.id ??
          `osm:${placeLat}:${placeLng}`;

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
          id: `${String(baseId)}-${idx}`,
          name: p.name ?? "Unknown",
          distanceKm,
          photoUrl: p.photoUrl ?? "",
          lat: placeLat,
          lng: placeLng,
          rating,
          totalRatings,
          openNow,
        } as PlaceUI;
      });

      setPlaces(mapped);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setRawError(msg);
      setError(msg);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [radiusInput]);

  const bottomSpacing = (insets.bottom ?? 0) + 100;

  const Header = useMemo(
    () => (
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 18 }]}>
        <Text style={styles.title}>Nearby Cafes (Debug)</Text>
        <Text style={styles.subtitle}>Discover coffee shops around you</Text>
      </View>
    ),
    [insets.top],
  );

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.centerContent}>
        <Text>No cafes found nearby</Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={PAGE_GRADIENT as any}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.screenContainer}
    >
      {Header}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View
          style={{
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#444" }}>Radius (m):</Text>
          <TextInput
            value={radiusInput}
            onChangeText={setRadiusInput}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 6,
              width: 100,
              borderRadius: 6,
              backgroundColor: "#fff",
            }}
          />
          <Button title="Refresh" onPress={() => load(false)} />
          <View style={{ width: 8 }} />
          <Button title="Test Manila" onPress={testWithCoords} />
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: "#333" }}>
            Current location:{" "}
            {lastLatLng
              ? `${lastLatLng.lat.toFixed(6)}, ${lastLatLng.lng.toFixed(6)}`
              : "unknown"}
          </Text>
          <Text style={{ fontSize: 12, color: "#333" }}>
            Places returned: {rawCount ?? "-"}
          </Text>
          {rawError ? (
            <Text style={{ fontSize: 12, color: "#b71c1c" }}>
              Last error: {rawError}
            </Text>
          ) : null}
        </View>

        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: ListRenderItemInfo<PlaceUI>) => (
            <CafeCard
              key={String(item.id)}
              name={item.name}
              address={item.address}
              distanceKm={item.distanceKm}
              openNow={item.openNow}
              photoUrl={
                item.photoUrl && item.photoUrl.length
                  ? item.photoUrl
                  : "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=60"
              }
              onPress={() => {
                console.log("pressed", item.name, item.lat, item.lng);
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: bottomSpacing }}
        />

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: "700", marginBottom: 6 }}>
            Raw debug sample (first element):
          </Text>
          <ScrollView
            style={{
              maxHeight: 160,
              backgroundColor: "#fff",
              padding: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: "#333" }}>
              {rawSample
                ? JSON.stringify(rawSample, null, 2)
                : "No sample available"}
            </Text>
          </ScrollView>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: "#333" }}>
            Manual Overpass test (curl/browser):
          </Text>
          <Text style={{ fontSize: 12, color: "#222", marginTop: 6 }}>
            Example curl (around 2km at Manila coords):
          </Text>
          <ScrollView
            style={{
              backgroundColor: "#f7f7f7",
              padding: 8,
              borderRadius: 6,
              marginTop: 6,
            }}
          >
            <Text selectable style={{ fontSize: 12, fontFamily: "monospace" }}>
              {`curl -X POST https://overpass-api.de/api/interpreter -d '[out:json][timeout:25];node["amenity"="cafe"](around:2000,14.5995,120.9842);out center;'`}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
              If that returns elements, Overpass is OK for those coords. If not,
              try increasing timeout or using a different server.
            </Text>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  header: {
    paddingHorizontal: 0,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 13,
    color: "#6D4C41",
    paddingHorizontal: 16,
  },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#b71c1c" },
});
