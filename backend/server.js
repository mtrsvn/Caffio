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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "caffio-gemini" });
});

// ─── Recommendations ──────────────────────────────────────────────────────────
app.post("/api/recommendations", async (req, res) => {
  const { items, userLogs } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  const logs = Array.isArray(userLogs) ? userLogs : [];
  if (logs.length === 0) {
    return res.json({
      recommendations: [],
      scored_by: "none",
      message: "No user logs yet; add logs to get personalized matches.",
    });
  }

  const preparedItems = items
    .map(enrichItem)
    .filter((it) => it.item_id && it.shopName);

  // Try Gemini first
  try {
    console.log(
      "[backend] Gemini scoring",
      JSON.stringify({ logs: logs.length, items: preparedItems.length }),
    );

    // Shuffle items so Gemini sees them in different order each call → varied scores on refresh
    const shuffledItems = [...preparedItems].sort(() => Math.random() - 0.5);
    const prompt = buildPrompt(logs, shuffledItems);
    const geminiResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.0, // introduce variety so refresh gives different results
      },
    });
    const text = geminiResult.response.text();
    const parsed = parseGeminiJson(text, preparedItems, logs);
    const diversified = diversify(parsed);
    console.log(
      "[backend] Gemini success",
      JSON.stringify({ recommendations: diversified.length }),
    );
    return res.json({ recommendations: diversified, scored_by: "gemini" });
  } catch (geminiErr) {
    const isQuota =
      geminiErr.status === 429 ||
      /quota|resource.?exhausted|rate.?limit/i.test(geminiErr.message || "");

    console.warn(
      isQuota
        ? "[backend] Gemini quota exceeded – falling back to local scorer"
        : "[backend] Gemini failed – falling back to local scorer",
      geminiErr.message,
    );

    try {
      // Add small noise so refreshing shows different ordering
      const fallback = diversify(localScore(preparedItems, logs)).map((r) => ({
        ...r,
        score: Math.min(100, Math.max(0, r.score + (Math.random() * 10 - 5))),
      }));
      return res.json({ recommendations: fallback, scored_by: "local" });
    } catch (localErr) {
      return res.status(500).json({
        error: "Scoring failed",
        details: geminiErr.message,
        scored_by: "none",
      });
    }
  }
});

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(logs, items) {
  const logSummary = logs.length
    ? logs.map((l) => ({
        coffeeType: l.coffeeType,
        tasteProfile: l.tasteProfile,
        rating: l.rating,
        favorite: l.favorite,
      }))
    : null;

  return `You are a coffee recommendation AI for a cafe app called Caffio.

${
  logSummary
    ? `The user's past coffee logs (use these to understand their taste):\n${JSON.stringify(logSummary, null, 2)}`
    : "The user has no past coffee logs yet. Give moderate scores (40-60) for variety."
}

Score each menu item for this user. Rules:
- Match coffeeType and tasteProfile tags with the user's history.
- Higher-rated and favorited logs signal stronger preference.
- Weight matches by how often (and how highly) the user logged them: treat the log weights as preference percentages and scale scores accordingly.
- If no tags match, still differentiate items by their inferred type and tags; do NOT give identical scores.
- Return ONLY a JSON array, no prose, no code fences.
- Each element: { "item_id": string, "shopName": string, "score": integer 0-100, "reason": string max 100 chars }
- Sort by score descending.

Menu items:
${JSON.stringify(
  items.map((it) => ({
    item_id: it.item_id,
    name: it.name,
    shopName: it.shopName,
    coffeeType: it.coffeeType || it.category || "",
    tasteProfile: it.tasteProfile || [],
  })),
  null,
  2,
)}

JSON array now:`;
}

// ─── Safe Gemini JSON parser ──────────────────────────────────────────────────
function parseGeminiJson(text, items, logs) {
  try {
    const cleaned = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r) => ({
        item_id: r.item_id,
        shopName: r.shopName,
        score: clampScore(r.score),
      }));
    }
  } catch (_) {
    // malformed – fall to local scorer
  }
  return localScore(items, logs);
}

// ─── Local scorer (no external dependencies) ──────────────────────────────────
function localScore(items, logs) {
  if (!logs.length) return [];

  const typeWeight = new Map();
  const tagWeight = new Map();
  let totalWeight = 0;

  logs.forEach((log) => {
    const rating = Math.max(1, Number(log.rating || 1));
    const w = rating + (log.favorite ? 3 : 0);
    totalWeight += w;

    const t = (log.coffeeType || "").trim().toLowerCase();
    if (t) typeWeight.set(t, (typeWeight.get(t) || 0) + w);

    (log.tasteProfile || []).forEach((tag) => {
      const n = (tag || "").trim().toLowerCase();
      if (n) tagWeight.set(n, (tagWeight.get(n) || 0) + w);
    });
  });

  const totalTypeWeight = Array.from(typeWeight.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const totalTagWeight = Array.from(tagWeight.values()).reduce(
    (a, b) => a + b,
    0,
  );

  const typePref = new Map(
    Array.from(typeWeight.entries()).map(([k, v]) => [
      k,
      v / (totalTypeWeight || 1),
    ]),
  );
  const tagPref = new Map(
    Array.from(tagWeight.entries()).map(([k, v]) => [
      k,
      v / (totalTagWeight || 1),
    ]),
  );

  return items
    .map((item) => {
      const t = (item.coffeeType || item.category || "").trim().toLowerCase();
      const tags = (item.tasteProfile || []).map((x) =>
        (x || "").trim().toLowerCase(),
      );

      let score = 35; // neutral base

      if (typePref.size) {
        if (typePref.has(t)) {
          score += Math.round(typePref.get(t) * 45); // up to 45 from type preference share
        } else {
          score += Math.round(0.15 * 45); // small novelty weight when type not in history
        }
      }

      if (tagPref.size) {
        const tagScore = tags.reduce(
          (sum, tag) => sum + (tagPref.get(tag) || 0),
          0,
        );
        score += Math.round(Math.min(tagScore, 1.5) * 35); // cap stacked tags
      }

      const activityBoost = Math.min(10, Math.log1p(totalWeight) * 2);
      score += activityBoost;

      score = Math.min(100, Math.max(0, Math.round(score)));

      return { item_id: item.item_id, shopName: item.shopName, score };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Item enrichment: derive type/taste tags from name/description/category ──
function enrichItem(raw) {
  const name = (raw.name || "").trim();
  const category = (raw.category || "").trim();
  const description = (raw.description || "").trim();

  const coffeeType = inferCoffeeType(name, category);
  const tasteProfile = inferTasteTags(`${name}. ${description}`);

  return {
    ...raw,
    coffeeType,
    tasteProfile,
  };
}

function inferCoffeeType(name, category) {
  const text = `${name} ${category}`.toLowerCase();
  const map = [
    ["cold brew", "Cold Brew"],
    ["nitro", "Cold Brew"],
    ["americano", "Americano"],
    ["latte", "Latte"],
    ["cappuccino", "Cappuccino"],
    ["flat white", "Flat White"],
    ["mocha", "Mocha"],
    ["macchiato", "Macchiato"],
    ["espresso", "Espresso"],
    ["frapp", "Frappuccino"],
    ["matcha", "Matcha"],
    ["tea", "Tea"],
    ["chocolate", "Chocolate"],
    ["refresher", "Refresher"],
  ];

  for (const [needle, value] of map) {
    if (text.includes(needle)) return value;
  }
  return category || name || "";
}

function inferTasteTags(text) {
  const lc = text.toLowerCase();
  const tags = new Set();
  const addIf = (word, tag) => {
    if (lc.includes(word)) tags.add(tag);
  };

  addIf("sweet", "sweet");
  addIf("caramel", "caramel");
  addIf("vanilla", "vanilla");
  addIf("chocolate", "chocolate");
  addIf("mocha", "chocolate");
  addIf("creamy", "creamy");
  addIf("milk", "creamy");
  addIf("foam", "creamy");
  addIf("bold", "bold");
  addIf("bitter", "bitter");
  addIf("smooth", "smooth");
  addIf("nutty", "nutty");
  addIf("spice", "spiced");
  addIf("chai", "spiced");
  addIf("berry", "fruity");
  addIf("fruit", "fruity");
  addIf("citrus", "citrus");
  addIf("matcha", "matcha");
  addIf("tea", "tea");
  addIf("iced", "iced");
  addIf("cold", "iced");
  addIf("hot", "hot");

  return Array.from(tags);
}

function clampScore(val) {
  const n = Number(val);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return 0;
}

// ─── Diversity filter: cap items per shop so results are not dominated by one brand ─
function diversify(list, maxPerShop = 6, maxTotal = 60) {
  const perShop = new Map();
  const out = [];
  for (const rec of list) {
    const key = rec.shopName || "";
    const count = perShop.get(key) || 0;
    if (count < maxPerShop) {
      out.push(rec);
      perShop.set(key, count + 1);
    }
    if (out.length >= maxTotal) break;
  }
  return out;
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
