import { getCoffeeLogs, saveUserRecommendations } from "../../firebaseconfig";
import { GEMINI_BACKEND_URL } from "../config";

export async function generateAndSaveRecommendations(uid: string) {
  try {
    const logs = await getCoffeeLogs(uid);
    const normalizedLogs = (logs || []).map((log: any) => ({
      coffeeType: log.coffeeType ?? "",
      tasteProfile: Array.isArray(log.tasteProfile) ? log.tasteProfile : [],
      rating: Number(log.rating ?? 0),
      favorite: Boolean(log.favorite),
      cafe: log.cafe ?? "",
    }));

    if (normalizedLogs.length === 0) {
      return;
    }

    const payload = {
      userId: uid,
      userLogs: normalizedLogs,
    };

    const response = await fetch(`${GEMINI_BACKEND_URL}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to load recommendations");
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];
    
    if (recommendations.length > 0) {
      await saveUserRecommendations(uid, recommendations);
      console.log("[aiRecommendations] Successfully generated and saved new recommendations for user:", uid);
    }
  } catch (err) {
    console.error("[aiRecommendations] generateAndSaveRecommendations failed", err);
  }
}
