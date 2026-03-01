export const GEOAPIFY_API_KEY = "4b643ca1e1ec40f58f83331d56a79296";
import Constants from "expo-constants";
import { Platform } from "react-native";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveGeminiBackendUrl() {
  const explicit = process.env.EXPO_PUBLIC_GEMINI_BACKEND_URL;
  if (explicit) {
    return stripTrailingSlash(explicit);
  }
  const configuredPort = process.env.EXPO_PUBLIC_GEMINI_BACKEND_PORT || "4000";

  // Prefer the host Expo provides (works for LAN/tunnel), fallback to emulator/localhost.
  const constants = Constants as any;
  const hostUri: string | undefined =
    constants?.expoConfig?.hostUri ||
    constants?.manifest?.debuggerHost ||
    constants?.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) {
      return `http://${host}:${configuredPort}`;
    }
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${configuredPort}`;
  }

  return `http://localhost:${configuredPort}`;
}

export const GEMINI_BACKEND_URL = resolveGeminiBackendUrl();
