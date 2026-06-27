import * as Location from "expo-location";
import { getDistance } from "geolib";
import { SyncLoader } from "../components/SyncLoader";
import { Search, MapIcon, List, Navigation, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    ListRenderItemInfo,
    Platform,
    PanResponder,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import Slider from "@react-native-community/slider";
import CafeCard from "../components/cafeCards";
import CafeDetailsSheet from "../components/cafeDetailsSheet";
import colors from "../components/colors";
import { fetchNearbyCafes, SimplePlace, fetchPlaceDetails, PlaceDetails } from "../utils/places";
import { PlaceUI } from "../components/cafeDetailsSheet";

const DEFAULT_RADIUS = 2000;
const MIN_RADIUS = 500;
const MAX_RADIUS = 15000;
const BASE_TABBAR_HEIGHT = 66;

type ViewMode = "list" | "map";

// We wrap the native Slider to maintain the same props interface
function DistanceSlider({
  value,
  min,
  max,
  onValueChange,
  onSlidingComplete,
}: {
  value: number;
  min: number;
  max: number;
  onValueChange: (val: number) => void;
  onSlidingComplete: (val: number) => void;
}) {
  return (
    <Slider
      style={{ width: "100%", height: 40 }}
      minimumValue={min}
      maximumValue={max}
      value={value}
      minimumTrackTintColor={colors.gradientStart}
      maximumTrackTintColor="#D9D1CA"
      thumbTintColor={colors.gradientStart}
      onValueChange={onValueChange}
      onSlidingComplete={onSlidingComplete}
    />
  );
}

function formatRadius(r: number): string {
  if (r >= 1000) return `${(r / 1000).toFixed(1)} km`;
  return `${r} m`;
}

const MemoizedMarker = React.memo(({ place, onSelect }: { place: PlaceUI; onSelect: (place: PlaceUI) => void }) => {
  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lng }}
      tracksViewChanges={false}
      onPress={() => onSelect(place)}
    >
      <View style={styles.markerDot}>
        <View style={styles.markerInner} />
      </View>
      <Callout tooltip={true}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {place.name}
          </Text>
          {place.rating ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={[styles.calloutSub, { marginLeft: 4, marginTop: 0 }]}>
                {place.rating} · {formatRadius(Math.round(place.distanceKm * 1000))}
              </Text>
            </View>
          ) : (
            <Text style={styles.calloutSub}>
              {formatRadius(Math.round(place.distanceKm * 1000))}
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
}, (prevProps, nextProps) => {
  return prevProps.place.id === nextProps.place.id && prevProps.place.distanceKm === nextProps.place.distanceKm;
});

export default function CafeScreen() {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceUI[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCafe, setSelectedCafe] = useState<PlaceUI | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCafeDetails, setSelectedCafeDetails] = useState<PlaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [sliderRadius, setSliderRadius] = useState(DEFAULT_RADIUS);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleSelectCafe = useCallback((place: PlaceUI) => {
    setSelectedCafe(place);
    setSheetVisible(true);
  }, []);

  useEffect(() => {
    if (selectedCafe) {
      setDetailsLoading(true);
      fetchPlaceDetails(selectedCafe.id).then((details) => {
        setSelectedCafeDetails(details);
        setDetailsLoading(false);
      });
    } else {
      setSelectedCafeDetails(null);
      setDetailsLoading(false);
    }
  }, [selectedCafe]);

  const tabBarHeight =
    BASE_TABBAR_HEIGHT +
    (insets.bottom ? insets.bottom : Platform.OS === "ios" ? 20 : 8);
  const footerSpacing = tabBarHeight + 16;

  const filteredPlaces = useMemo(() => {
    let list = places.filter((p) => p.distanceKm <= radius / 1000);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [places, searchQuery, radius]);

  const load = useCallback(async (r = DEFAULT_RADIUS) => {
    setError(null);
    setLoading(true);
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
      setUserLocation({ lat, lng });

      const results: SimplePlace[] = await fetchNearbyCafes(lat, lng, r);

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
        const uniqueId = String(baseId);

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

      setPlaces((prev) => {
        const copy = [...prev];
        mapped.forEach((newPlace) => {
          if (!copy.some((existing) => existing.id === newPlace.id)) {
            copy.push(newPlace);
          }
        });
        return copy;
      });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg.includes("Geoapify") ? `Server error: ${msg}` : msg);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(radius);
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(radius);
    } finally {
      setRefreshing(false);
    }
  }, [load, radius]);

  const handleRadiusChange = useCallback((val: number) => {
    setSliderRadius(val);
  }, []);

  const handleRadiusCommit = useCallback(
    async (val: number) => {
      setRadius(val);
      await load(val);
    },
    [load]
  );

  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [userLocation]);

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    if (loading) return null;
    return (
      <View style={styles.centerContent}>
        <Text style={styles.emptyText}>No cafes found nearby</Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets.top ?? 0) + 8 }]}>
        <Text style={styles.titleLabel}>DISCOVER</Text>
        <Text style={styles.subtitle}>Coffee shops around you</Text>
      </View>

      {/* Search + View Toggle row */}
      <View style={styles.controlsRow}>
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

        {/* Map / List Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "list" && styles.toggleBtnActive,
            ]}
            onPress={() => setViewMode("list")}
            activeOpacity={0.8}
          >
            <List
              size={18}
              color={
                viewMode === "list" ? "#FFF" : colors.gradientStart
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "map" && styles.toggleBtnActive,
            ]}
            onPress={() => setViewMode("map")}
            activeOpacity={0.8}
          >
            <MapIcon
              size={18}
              color={viewMode === "map" ? "#FFF" : colors.gradientStart}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Distance Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>Distance</Text>
          <Text style={styles.sliderValue}>{formatRadius(sliderRadius)}</Text>
        </View>
        <DistanceSlider
          value={sliderRadius}
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          onValueChange={handleRadiusChange}
          onSlidingComplete={handleRadiusCommit}
        />
        <View style={styles.sliderTickRow}>
          <Text style={[styles.sliderTick, { left: 10 }]}>500m</Text>
          <Text style={[styles.sliderTick, { left: '50%', transform: [{ translateX: -12 }] }]}>7.5 km</Text>
          <Text style={[styles.sliderTick, { right: 10 }]}>15 km</Text>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingRow}>
          <SyncLoader color={colors.gradientStart} size={8} speedMultiplier={0.8} />
        </View>
      )}

      {/* MAP VIEW */}
      {viewMode === "map" && (
        <View style={[styles.mapContainer, { marginBottom: tabBarHeight }]}>
          {userLocation ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {filteredPlaces.map((place) => (
                <MemoizedMarker
                  key={place.id}
                  place={place}
                  onSelect={handleSelectCafe}
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>Getting your location…</Text>
            </View>
          )}

          {/* Re-center button */}
          {userLocation && (
            <TouchableOpacity
              style={styles.recenterBtn}
              onPress={centerOnUser}
              activeOpacity={0.85}
            >
              <Navigation size={18} color={colors.gradientStart} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Cafe count badge */}
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredPlaces.length} cafes</Text>
          </View>
        </View>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: ListRenderItemInfo<PlaceUI>) => (
            <CafeCard
              place={item}
              onPress={() => {
                setSelectedCafe(item);
                setSheetVisible(true);
              }}
            />
          )}
          ListHeaderComponent={
            refreshing ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <SyncLoader color={colors.gradientStart} size={10} speedMultiplier={0.8} />
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor="transparent"
              colors={["transparent"]}
              progressBackgroundColor="transparent"
              progressViewOffset={-1000}
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
      )}

      <CafeDetailsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onExited={() => setSelectedCafe(null)}
        selectedCafe={selectedCafe}
        selectedCafeDetails={selectedCafeDetails}
        detailsLoading={detailsLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#EDE8E2" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  titleLabel: {
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

  // Controls row
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  searchInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4DED7",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOpacity: 0.4,
        shadowRadius: 6,
        shadowOffset: { width: 3, height: 3 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#E4DED7",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 3, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: colors.gradientStart,
    ...Platform.select({
      ios: {
        shadowColor: colors.gradientStart,
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },

  // Slider
  sliderSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#E4DED7",
    borderRadius: 16,
    marginHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 3, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gradientStart,
  },
  sliderTickRow: {
    flexDirection: "row",
    position: "relative",
    height: 16,
    marginTop: 2,
  },
  sliderTick: {
    fontSize: 10,
    color: colors.textMuted,
    position: "absolute",
  },
  loadingRow: {
    alignItems: "center",
    paddingVertical: 12,
  },

  // Map
  mapContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 8,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gradientStart,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },
  calloutContainer: {
    backgroundColor: "#EDE8E2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: "#D9D1CA",
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  calloutSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  recenterBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE8E2",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  countBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EDE8E2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gradientStart,
  },

  // Common
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: colors.textMuted },
  errorText: { color: "#b71c1c" },
});
