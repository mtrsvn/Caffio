const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const PORT = process.env.PORT || 4000;

if (!process.env.GEMINI_API_KEY) {
  console.error("[backend] GEMINI_API_KEY is missing in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "caffio-gemini-palate" });
});

// ─── Recommendations ──────────────────────────────────────────────────────────
app.post("/api/recommendations", async (req, res) => {
  const { userLogs } = req.body || {};

  const logs = Array.isArray(userLogs) ? userLogs : [];
  if (logs.length === 0) {
    return res.json({
      recommendations: [],
      scored_by: "none",
      message: "No user logs yet; add logs to get personalized matches.",
    });
  }

  try {
    console.log("[backend] Requesting Palate Expansion from Gemini...", logs.length);
    const prompt = buildPrompt(logs);
    const geminiResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.1, // High temperature for creative/diverse recommendations
      },
    });
    
    const text = geminiResult.response.text();
    const parsed = parseGeminiJson(text);
    
    console.log("[backend] Gemini success, generated", parsed.length, "recommendations");
    return res.json({ recommendations: parsed, scored_by: "gemini" });
  } catch (err) {
    console.error("[backend] Gemini failed, using fallback", err.message);
    
    // Fallback static list of diverse coffee styles if Gemini is down
    const fallbackRecs = [
      {
        id: "fb-1",
        name: "Classic Cortado",
        description: "Equal parts espresso and warm milk to reduce acidity while retaining the bold coffee flavor.",
        reason: "A perfectly balanced drink to try when you want strong coffee without the bitterness.",
        tags: ["bold", "creamy", "smooth"],
        match_score: 85
      },
      {
        id: "fb-2",
        name: "Honey Processed Pour-over",
        description: "Coffee beans dried with the sweet fruit mucilage still attached, resulting in a naturally sweet cup.",
        reason: "Since you are exploring coffee, this offers a naturally sweeter and fruitier taste profile.",
        tags: ["sweet", "fruity", "black"],
        match_score: 80
      },
      {
        id: "fb-3",
        name: "Nitro Cold Brew",
        description: "Cold brew infused with nitrogen gas for a sweet flavor and a rich, creamy head of foam.",
        reason: "A great alternative for an iced coffee lover looking for a smooth, creamy texture without added dairy.",
        tags: ["iced", "smooth", "creamy"],
        match_score: 82
      },
      {
        id: "fb-4",
        name: "Spanish Latte",
        description: "Espresso mixed with normal milk and sweetened condensed milk.",
        reason: "A decadent, sweeter alternative to a standard latte.",
        tags: ["sweet", "creamy", "milky"],
        match_score: 88
      },
      {
        id: "fb-5",
        name: "Matcha Espresso Fusion",
        description: "Earthy matcha green tea layered with milk and a shot of bold espresso.",
        reason: "A beautiful, earthy, and highly caffeinated drink to expand your palate.",
        tags: ["earthy", "matcha", "layered"],
        match_score: 75
      }
    ];

    return res.json({ recommendations: fallbackRecs, scored_by: "local_fallback" });
  }
});

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(logs) {
  const logSummary = logs.length
    ? logs.map((l) => ({
        coffeeType: l.coffeeType,
        tasteProfile: l.tasteProfile,
        rating: l.rating,
        favorite: l.favorite,
      }))
    : null;

  return `You are a coffee recommendation AI for a cafe app called Caffio. The app focuses on expanding the user's palate by recommending generic, non-branded coffee types, brewing methods, or bean origins that they can try at any local specialty coffee shop.

${
  logSummary
    ? `The user's past coffee logs (use these to understand their taste):\n${JSON.stringify(logSummary, null, 2)}`
    : "The user has no past coffee logs yet. Give them 5 diverse and interesting coffee recommendations (e.g., Cortado, Ethiopian Light Roast, Nitro Cold Brew, Flat White, Honey Processed Pour-over)."
}

Based on this history, generate exactly 5 coffee recommendations to expand their palate.
Rules:
1. The recommendations MUST be generic (e.g., "Spanish Latte", "Macchiato", "Guatemalan Washed Bean"). Do NOT use any trademarked brand names like Starbucks, Dunkin, Frappuccino, etc.
2. Explain exactly why you are recommending this to them based on their past preferences.
3. Include 2-3 taste tags (e.g., "sweet", "creamy", "bold").
4. Return ONLY a JSON array, no markdown formatting or prose.

Format each object in the array exactly like this:
{
  "id": "a unique string id",
  "name": "Name of the coffee type/bean",
  "description": "A short 1-2 sentence description of what it is",
  "reason": "Why you recommend it based on their logs (e.g., 'Since you love sweet and creamy lattes...')",
  "tags": ["tag1", "tag2"],
  "match_score": 95 // an integer 0-100 indicating how well it matches their past preferences
}

JSON array now:`;
}

// ─── Safe Gemini JSON parser ──────────────────────────────────────────────────
function parseGeminiJson(text) {
  try {
    const cleaned = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r) => ({
        id: r.id || Math.random().toString(36).substring(7),
        name: r.name || "Unknown Coffee",
        description: r.description || "",
        reason: r.reason || "",
        tags: Array.isArray(r.tags) ? r.tags : [],
        match_score: clampScore(r.match_score),
      }));
    }
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text, e);
  }
  return [];
}

function clampScore(val) {
  const n = Number(val);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return 80;
}

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅  Caffio Gemini backend running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[backend] Port ${PORT} is busy. Run: PORT=4001 node server.js`,
    );
    process.exit(1);
  }
  throw err;
});
