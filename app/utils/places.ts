import AsyncStorage from "@react-native-async-storage/async-storage";
import { GOOGLE_PLACES_API_KEY } from "../config";

export type SimplePlace = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  raw?: any;
  rating?: number;
  totalRatings?: number;
  openNow?: boolean;
};

const GOOGLE_PLACES_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const GOOGLE_PLACE_DETAILS_API = "https://maps.googleapis.com/maps/api/place/details/json";
const GOOGLE_PHOTO_API = "https://maps.googleapis.com/maps/api/place/photo";

const CACHE_TTL = 1000 * 60 * 5;
const MAX_RADIUS = 50000;

function cacheKey(lat: number, lng: number, radius: number) {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `places_geo:${roundedLat}:${roundedLng}:${radius}`;
}

async function getCachedPlaces(key: string): Promise<SimplePlace[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; value: SimplePlace[] };
    if (Date.now() - parsed.ts > CACHE_TTL) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

async function setCachedPlaces(key: string, value: SimplePlace[]) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), value });
    await AsyncStorage.setItem(key, payload);
  } catch {}
}

function buildGooglePlacesUrl(lat: number, lng: number, radius: number) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type: "cafe",
    key: GOOGLE_PLACES_API_KEY || "",
  });
  return `${GOOGLE_PLACES_API}?${params.toString()}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000,
) {
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Request timed out")),
      timeoutMs,
    );
    fetch(url, options)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function fetchNearbyCafes(
  lat: number,
  lng: number,
  radius = 2000,
): Promise<SimplePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error(
      "Google Places API key not set. Put it in your .env as EXPO_PUBLIC_GOOGLE_PLACES_API_KEY.",
    );
  }

  if (!radius || radius <= 0) radius = 2000;
  if (radius > MAX_RADIUS) radius = MAX_RADIUS;

  const key = cacheKey(lat, lng, radius);
  const cached = await getCachedPlaces(key);
  if (cached) return cached;

  const url = buildGooglePlacesUrl(lat, lng, radius);
  const res = await fetchWithTimeout(url, {}, 15000);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google Places request failed: ${res.status} ${txt}`);
  }
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places Error: ${data.status} ${data.error_message || ""}`);
  }

  const results = Array.isArray(data.results) ? data.results : [];

  const places: SimplePlace[] = results.map((p: any) => {
    let photoUrl;
    if (p.photos && p.photos.length > 0) {
      const ref = p.photos[0].photo_reference;
      photoUrl = `${GOOGLE_PHOTO_API}?maxwidth=800&photo_reference=${ref}&key=${GOOGLE_PLACES_API_KEY}`;
    }

    return {
      id: `google:${p.place_id}`,
      name: p.name ?? "Cafe",
      address: p.vicinity,
      lat: p.geometry?.location?.lat ?? 0,
      lng: p.geometry?.location?.lng ?? 0,
      photoUrl,
      raw: p,
      rating: p.rating,
      totalRatings: p.user_ratings_total,
      openNow: p.opening_hours?.open_now,
    } as SimplePlace;
  });

  await setCachedPlaces(key, places);
  return places;
}

export type PlaceDetails = {
  phoneNumber?: string;
  website?: string;
  weekdayText?: string[];
  priceLevel?: number;
  editorialSummary?: string;
};

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  const realId = placeId.replace("google:", "");
  
  const params = new URLSearchParams({
    place_id: realId,
    fields: "formatted_phone_number,website,opening_hours,price_level,editorial_summary",
    key: GOOGLE_PLACES_API_KEY,
  });

  try {
    const res = await fetch(`${GOOGLE_PLACE_DETAILS_API}?${params.toString()}`);
    const data = await res.json();
    if (data.status !== "OK") return null;
    
    const result = data.result;
    return {
      phoneNumber: result.formatted_phone_number,
      website: result.website,
      weekdayText: result.opening_hours?.weekday_text,
      priceLevel: result.price_level,
      editorialSummary: result.editorial_summary?.overview,
    };
  } catch (e) {
    return null;
  }
}

async function getImageCache(key: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; value: string };
    if (Date.now() - parsed.ts > CACHE_TTL) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

async function setImageCache(key: string, value: string) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), value });
    await AsyncStorage.setItem(key, payload);
  } catch {}
}

export async function getImageForPlace(
  place: { id?: string; name: string; photoUrl?: string; raw?: any },
  width = 800,
): Promise<string> {
  const cacheK = `place_img:${place.id ?? place.name}`;
  const cached = await getImageCache(cacheK);
  if (cached) return cached;

  if (place.photoUrl) {
    await setImageCache(cacheK, place.photoUrl);
    return place.photoUrl;
  }

  const fallback = `https://source.unsplash.com/random/${width}x${Math.round((width * 3) / 4)}?cafe`;
  await setImageCache(cacheK, fallback);
  return fallback;
}
