/**
 * app/utils/places.ts
 *
 * Free Places + Image helpers using:
 * - Overpass API (OpenStreetMap) for locations (no key)
 * - Wikimedia Commons API for real photos (no key)
 * - Unsplash Source as fallback (no key)
 *
 * Includes:
 * - fetchNearbyCafes(lat,lng,radius) with bbox, server failover, retries, and caps
 * - getImageForPlace(place,width) which uses Wikimedia + Unsplash fallback
 * - searchWikimediaCommonsImage and getImageFromWikimediaFilename helpers
 *
 * Usage:
 * import { fetchNearbyCafes, getImageForPlace, SimplePlace } from '../utils/places';
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type SimplePlace = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  geometry?: { location: { lat: number; lng: number } };
  photoUrl?: string;
  raw?: any;
};

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const UNSPLASH_SOURCE = (w = 800, h = 600) =>
  `https://source.unsplash.com/${w}x${h}/?coffee,cafe`;

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const MAX_RADIUS = 5000; // cap radius to 5 km
const MAX_RESULTS = 250; // client-side cap of returned places
const QUERY_TIMEOUT_SECONDS = 60; // Overpass timeout parameter

/* -------------------------
   Simple AsyncStorage cache helpers
   ------------------------- */
function cacheKey(lat: number, lng: number, radius: number) {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `osm_places:${roundedLat}:${roundedLng}:${radius}`;
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
  } catch {
    // ignore cache write errors
  }
}

/* -------------------------
   Helpers: bbox, fetchWithTimeout, Overpass failover
   ------------------------- */
function bboxFromLatLng(lat: number, lng: number, radiusMeters: number) {
  // approximate (works for moderate radii)
  const latDelta = radiusMeters / 111320; // degrees latitude per meter
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const south = lat - latDelta;
  const north = lat + latDelta;
  const west = lng - lngDelta;
  const east = lng + lngDelta;
  return { south, west, north, east };
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

async function postToOverpass(query: string) {
  // Try servers in order with small exponential backoff
  let attempt = 0;
  for (const server of OVERPASS_SERVERS) {
    attempt++;
    try {
      const timeoutMs = 15000 + attempt * 5000; // increase timeout per attempt
      const res = await fetchWithTimeout(
        server,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: query,
        },
        timeoutMs,
      );

      if (!res.ok) {
        // treat 429/504/5xx as temporary: try next server
        if (res.status === 429 || res.status === 504 || res.status >= 500) {
          console.warn(
            `[Overpass] ${server} returned ${res.status}; trying next server`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        const txt = await res.text().catch(() => "");
        throw new Error(`Overpass server error ${res.status}: ${txt}`);
      }

      const json = await res.json();
      return json;
    } catch (err: any) {
      console.warn(`[Overpass] ${server} failed: ${err?.message ?? err}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
  }
  throw new Error(
    "Overpass: all servers failed or timed out. Try reducing radius or try again later.",
  );
}

/* -------------------------
   Main: fetchNearbyCafes
   ------------------------- */
export async function fetchNearbyCafes(
  lat: number,
  lng: number,
  radius = 2000,
): Promise<SimplePlace[]> {
  // sanitize and cap radius
  if (!radius || radius <= 0) radius = 2000;
  if (radius > MAX_RADIUS) {
    console.warn(
      `[places] requested radius ${radius} > ${MAX_RADIUS}, capping to ${MAX_RADIUS}`,
    );
    radius = MAX_RADIUS;
  }

  const key = cacheKey(lat, lng, radius);
  const cached = await getCachedPlaces(key);
  if (cached) {
    // console.log('[places] returning cached', cached.length);
    return cached;
  }

  // build bbox to avoid heavy around() queries for large radii
  const { south, west, north, east } = bboxFromLatLng(lat, lng, radius);

  // Query only nodes and ways (skip relations for performance)
  const query = `
    [out:json][timeout:${QUERY_TIMEOUT_SECONDS}];
    (
      node["amenity"="cafe"](${south},${west},${north},${east});
      way["amenity"="cafe"](${south},${west},${north},${east});
    );
    out center;
  `;

  const data = await postToOverpass(query);
  const elements: any[] = Array.isArray(data.elements) ? data.elements : [];

  const places: SimplePlace[] = elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLon = el.lon ?? el.center?.lon ?? 0;
      const name = el.tags?.name ?? el.tags?.brand ?? "Cafe";
      const addressParts = [
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(" ") : undefined;
      const img = el.tags?.image ?? el.tags?.wikimedia_commons ?? undefined;

      return {
        id: `osm:${el.type}/${el.id}`,
        name,
        address,
        lat: elLat,
        lng: elLon,
        geometry: { location: { lat: elLat, lng: elLon } },
        photoUrl: img,
        raw: el,
      } as SimplePlace;
    })
    .slice(0, MAX_RESULTS);

  await setCachedPlaces(key, places);
  return places;
}

/* -------------------------
   Image helpers (Wikimedia + Unsplash fallback)
   ------------------------- */
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
  } catch {
    // ignore
  }
}

export async function getImageForPlace(
  place: { id?: string; name: string; photoUrl?: string; raw?: any },
  width = 800,
): Promise<string> {
  const cacheK = `osm_img:${place.id ?? place.name}`;
  const cached = await getImageCache(cacheK);
  if (cached) return cached;

  const maybe = place.photoUrl ?? place.raw?.tags?.image;
  if (maybe && /^https?:\/\//i.test(maybe)) {
    await setImageCache(cacheK, maybe);
    return maybe;
  }

  const wikimediaTag = place.raw?.tags?.wikimedia_commons;
  if (wikimediaTag) {
    const resolved = await getImageFromWikimediaFilename(wikimediaTag, width);
    if (resolved) {
      await setImageCache(cacheK, resolved);
      return resolved;
    }
  }

  const commons = await searchWikimediaCommonsImage(place.name, width);
  if (commons) {
    await setImageCache(cacheK, commons);
    return commons;
  }

  const fallback = UNSPLASH_SOURCE(width, Math.round((width * 3) / 4));
  await setImageCache(cacheK, fallback);
  return fallback;
}

export async function searchWikimediaCommonsImage(
  query: string,
  width = 800,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrlimit: "5",
      gsrsearch: query,
      gsrnamespace: "6", // File:
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: String(width),
      format: "json",
      origin: "*",
    });

    const url = `${WIKIMEDIA_API}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.query || !data.query.pages) return null;
    const pages = Object.values<any>(data.query.pages);
    for (const p of pages) {
      if (p.imageinfo && p.imageinfo.length) {
        const ii = p.imageinfo[0];
        if (ii.thumburl) return ii.thumburl;
        if (ii.url) return ii.url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getImageFromWikimediaFilename(
  filename: string,
  width = 800,
): Promise<string | null> {
  try {
    let title = filename;
    if (!/^File:/i.test(title)) title = `File:${title}`;
    const params = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: String(width),
      format: "json",
      origin: "*",
    });
    const url = `${WIKIMEDIA_API}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.query || !data.query.pages) return null;
    const pages = Object.values<any>(data.query.pages);
    const p = pages[0];
    if (p.imageinfo && p.imageinfo.length) {
      const ii = p.imageinfo[0];
      if (ii.thumburl) return ii.thumburl;
      if (ii.url) return ii.url;
    }
    return null;
  } catch {
    return null;
  }
}
