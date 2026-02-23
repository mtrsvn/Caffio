import AsyncStorage from "@react-native-async-storage/async-storage";
import { GEOAPIFY_API_KEY } from "../config";

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

const GEOAPIFY_PLACES = "https://api.geoapify.com/v2/places";
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const UNSPLASH_SOURCE = (w = 800, h = 600) =>
  `https://source.unsplash.com/random/${w}x${h}`;

const CACHE_TTL = 1000 * 60 * 5;
const MAX_RADIUS = 5000;
const MAX_RESULTS = 200;

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

function buildGeoapifyUrl(
  lat: number,
  lng: number,
  radius: number,
  limit = 50,
) {
  const params = new URLSearchParams({
    apiKey: GEOAPIFY_API_KEY,
    categories: "catering.cafe",
    limit: String(limit),

    filter: `circle:${lng},${lat},${radius}`,

    bias: `proximity:${lng},${lat}`,
  });
  return `${GEOAPIFY_PLACES}?${params.toString()}`;
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
  if (!GEOAPIFY_API_KEY || GEOAPIFY_API_KEY.length === 0) {
    throw new Error(
      "Geoapify API key not set. Put it in app/config.ts as GEOAPIFY_API_KEY.",
    );
  }

  if (!radius || radius <= 0) radius = 2000;
  if (radius > MAX_RADIUS) {
    console.warn(
      `[places-geo] requested radius ${radius} > ${MAX_RADIUS}, capping to ${MAX_RADIUS}`,
    );
    radius = MAX_RADIUS;
  }

  const key = cacheKey(lat, lng, radius);
  const cached = await getCachedPlaces(key);
  if (cached) return cached;

  const url = buildGeoapifyUrl(lat, lng, radius, 50);
  const res = await fetchWithTimeout(url, {}, 15000);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Geoapify Places request failed: ${res.status} ${txt}`);
  }
  const data = await res.json();

  const features = Array.isArray(data.features) ? data.features : [];

  const places: SimplePlace[] = features
    .map((f: any) => {
      const props = f.properties ?? {};
      const loc = f.geometry?.coordinates ?? [0, 0];
      const latF = loc[1];
      const lngF = loc[0];
      const photo = props.image_url ?? props.photo?.url ?? undefined;
      const addressParts = [
        props.housenumber,
        props.street,
        props.city,
        props.state,
      ].filter(Boolean);
      const address = addressParts.length
        ? addressParts.join(" ")
        : (props.formatted ?? undefined);

      return {
        id: `geo:${props.place_id ?? props.xid ?? props.fsq_id ?? f.id}`,
        name: props.name ?? "Cafe",
        address,
        lat: latF,
        lng: lngF,
        photoUrl: photo,
        raw: f,
        rating: props.rating ?? undefined,
        totalRatings: props.user_ratings_total ?? undefined,
        openNow: props.hours?.is_open ?? undefined,
      } as SimplePlace;
    })
    .slice(0, MAX_RESULTS);

  await setCachedPlaces(key, places);
  return places;
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

  if (place.photoUrl && /^https?:\/\//.test(place.photoUrl)) {
    await setImageCache(cacheK, place.photoUrl);
    return place.photoUrl;
  }

  const maybe =
    place.raw?.properties?.image_url ?? place.raw?.properties?.photo?.url;
  if (maybe && /^https?:\/\//.test(maybe)) {
    await setImageCache(cacheK, maybe);
    return maybe;
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
      gsrnamespace: "6",
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
