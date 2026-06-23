// ✅ CRITICAL: Load .env before anything else
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Import fetch for LiteAPI calls
const fetch = require("node-fetch");

// Import diagnostics
const { diagLiteAPI } = require("./diag.js");

// ✅ Live LiteAPI key authentication enabled — mock fallback removed (21 Oct 2025)
const apiKey =
  process.env.LITEAPI_KEY ||
  process.env.VITE_LITEAPI_KEY ||
  process.env.PROD_API_KEY ||
  process.env.SAND_API_KEY;
console.log("🔑 LiteAPI key loaded:", !!apiKey ? "✅ Found" : "❌ Missing");
if (apiKey) {
  console.log("Key preview:", apiKey?.slice(0, 8) + "...");
}

const isSandbox = apiKey?.startsWith("sand_");
console.log(`🌐 Running in ${isSandbox ? "Sandbox" : "Live"} mode`);

// Enhanced API key logging
if (!apiKey) {
  console.error("❌ No LiteAPI key found in environment variables.");
} else {
  const keyType = isSandbox ? "Sandbox (test data)" : "Production (live data)";
  console.log(`🌐 LiteAPI mode: ${keyType}`);
  console.log(`🔑 Key prefix: ${apiKey.slice(0, 8)}...`);
}
console.log("🧪 ENV CHECK:");
console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing"
);
console.log(
  "SAND_API_KEY:",
  process.env.SAND_API_KEY ? "✅ Loaded" : "❌ Missing"
);
console.log(
  "PROD_API_KEY:",
  process.env.PROD_API_KEY ? "✅ Loaded" : "❌ Missing"
);
console.log("PORT:", process.env.PORT || "❌ Missing");

// 🧩 Confirm dotenv loaded successfully
console.log("🔐 ENV TEST:", {
  SAND_API_KEY: !!process.env.SAND_API_KEY,
  PROD_API_KEY: !!process.env.PROD_API_KEY,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "not set",
});

if (!process.env.SAND_API_KEY || !process.env.GEMINI_API_KEY) {
  console.warn("⚠️ Missing required API keys in .env file!");
  if (!process.env.SAND_API_KEY) {
    console.warn("⚠️ No LiteAPI sandbox key found — running in DEMO mode");
    process.env.SAND_API_KEY = "DEMO";
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ No Gemini key found — running in DEMO mode");
  }
} else {
  console.log("✅ All required keys found, proceeding to initialize server...");
}

// Check for production keys
if (process.env.NODE_ENV === "production") {
  if (process.env.PROD_API_KEY) {
    console.log(
      "🏨 Production LiteAPI key detected - Standard Authentication enabled"
    );
  } else {
    console.warn("⚠️ Production mode but missing PROD_API_KEY");
  }
}

// LiteAPI Proxy with Logging
const LITEAPI_BASE =
  process.env.VITE_LITEAPI_URL || "https://api.liteapi.travel/v3.0";
const LITEAPI_KEY = process.env.PROD_API_KEY || process.env.SAND_API_KEY;

function logLite(name, obj) {
  const safe = JSON.stringify(obj, null, 2)?.slice(0, 4000);
  console.log(`[LiteAPI:${name}]`, safe);
}

async function fetchLite(path, { signal, params } = {}) {
  const url = new URL(`${LITEAPI_BASE}${path}`);
  if (params)
    Object.entries(params).forEach(
      ([k, v]) => v != null && url.searchParams.set(k, v)
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    console.log("🌍 Fetching LiteAPI for:", url.toString());
    const res = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
      signal: signal || controller.signal,
    });

    console.log("📡 LiteAPI response status:", res.status);

    // ✅ Safer JSON parsing with fallback
    const json = await res.json().catch(async () => {
      const text = await res.text();
      console.warn("⚠️ Non-JSON response from LiteAPI:", text.slice(0, 500));
      return { error: "Non-JSON response", raw: text };
    });

    console.log("✅ LiteAPI JSON keys:", Object.keys(json || {}));

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
  } catch (err) {
    console.error("❌ fetchLite error:", err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Normalization helpers
function normalizeHotel(h, city) {
  // 🔍 COMPREHENSIVE IMAGE EXTRACTION - Try all possible image field variations
  // Log image field exploration for debugging (only for first hotel to avoid spam)
  if (!normalizeHotel._logged) {
    console.log("🔍 Exploring image fields in raw hotel object:");
    console.log("  - h.photo_main:", h?.photo_main);
    console.log("  - h.media:", h?.media);
    console.log("  - h.media?.[0]?.url:", h?.media?.[0]?.url);
    console.log("  - h.imageUrl:", h?.imageUrl);
    console.log("  - h.photos:", h?.photos);
    console.log("  - h.photos?.[0]?.url:", h?.photos?.[0]?.url);
    console.log("  - h.images:", h?.images);
    console.log("  - h.images?.[0]?.url:", h?.images?.[0]?.url);
    console.log("  - h.image:", h?.image);
    console.log("  - h.photoUrl:", h?.photoUrl);
    console.log("  - h.mainImage:", h?.mainImage);
    console.log("  - h.thumbnail:", h?.thumbnail);
    console.log("  - h.photo:", h?.photo);
    console.log("  - All hotel keys:", Object.keys(h || {}));
    normalizeHotel._logged = true;
  }

  const img =
    h?.photo_main ||
    h?.media?.[0]?.url ||
    h?.imageUrl ||
    h?.photos?.[0]?.url ||
    h?.images?.[0]?.url ||
    h?.image ||
    h?.photoUrl ||
    h?.mainImage ||
    h?.thumbnail ||
    h?.photo ||
    null;

  if (!normalizeHotel._imgLogged && img) {
    console.log(`✅ Found image for ${h?.name || "hotel"}: ${img}`);
    normalizeHotel._imgLogged = true;
  } else if (!normalizeHotel._imgLogged && !img) {
    console.warn(
      `⚠️ No image found for ${h?.name || "hotel"} - will use fallback`
    );
    normalizeHotel._imgLogged = true;
  }

  // price
  const price =
    h?.price?.amount || h?.rates?.[0]?.amount || h?.minPrice || null;

  // booking
  const bookingUrl = h?.bookingUrl || h?.links?.booking || h?.url || null;

  // Extract description from multiple possible fields
  const description =
    h?.description ||
    h?.shortDescription ||
    h?.summary ||
    h?.overview ||
    h?.about ||
    "";

  return {
    id: h?.id || h?.hotelId || `${h?.name}-${h?.address?.line1 || ""}`,
    name: h?.name || "Unnamed Hotel",
    city: h?.address?.city || h?.city || city,
    country: h?.address?.country || h?.country || "",
    address: h?.address?.line1 || h?.address || "",
    image: img,
    price,
    bookingUrl,
    description: description,
    hotelDescription: h?.hotelDescription || description,
    shortDescription: h?.shortDescription || description,
    summary: h?.summary || description,
    meta: h,
  };
}

function normalizeEvent(e, city) {
  const img = e?.media?.[0]?.url || e?.images?.[0]?.url || e?.imageUrl || null;

  return {
    id: e?.id || e?.eventId || `${e?.name}-${e?.startDate || ""}`,
    name: e?.name || "Untitled Event",
    city: e?.location?.city || e?.city || city,
    country: e?.location?.country || e?.country || "",
    startDate: e?.startDate || e?.start_time || null,
    endDate: e?.endDate || e?.end_time || null,
    image: img,
    url: e?.url || e?.bookingUrl || e?.links?.web || null,
    category: e?.category || e?.type || "",
    description: e?.description || "",
    meta: e,
  };
}

// Data normalization functions
function normalizeHotelData(rawHotels, city) {
  if (!Array.isArray(rawHotels)) return [];
  return rawHotels.map((h) => ({
    id: h.id || crypto.randomUUID(),
    name: h.name || "Unnamed Hotel",
    city: h.cityName || h.address?.city || city || "Unknown city",
    description:
      h.description || h.shortDescription || "No description available",
    image:
      h.photo_main ||
      h.media?.[0]?.url ||
      h.imageUrl ||
      h.photos?.[0]?.url ||
      h.images?.[0]?.url ||
      h.image ||
      h.photoUrl ||
      h.mainImage ||
      h.thumbnail ||
      h.photo ||
      `https://source.unsplash.com/featured/?hotel,travel,${encodeURIComponent(
        city
      )}`,
    price:
      h.price?.amount || h.rates?.[0]?.retailRate?.total?.amount
        ? `$${h.rates[0].retailRate.total.amount}`
        : h.priceRange || "Contact for pricing",
    date: h.date || "Available",
    link: h.url || h.bookingUrl || h.deep_link || h.links?.web || "#",
    bookingUrl: h.url || h.bookingUrl || h.deep_link || h.links?.web || null,
    available: h.available ?? true,
  }));
}

function normalizeEventData(rawEvents, city) {
  if (!Array.isArray(rawEvents)) return [];
  return rawEvents.map((e) => ({
    id: e.id || crypto.randomUUID(),
    name: e.name || e.title || "Untitled Event",
    city: e.location?.city || e.city || city || "Unknown",
    description: e.description || e.shortDescription || "No details available",
    image:
      e.media?.[0]?.url ||
      e.images?.[0]?.url ||
      e.image_url ||
      e.imageUrl ||
      e.image ||
      `https://source.unsplash.com/featured/?festival,concert,${encodeURIComponent(
        city
      )}`,
    date: e.startDate || e.date || "Date not specified",
    price: e.price || e.cost || "Contact for pricing",
    link: e.url || e.bookingUrl || "#",
  }));
}

function normalizeGuideData(rawGuides, city) {
  if (!Array.isArray(rawGuides)) return [];
  return rawGuides.map((g) => ({
    id: g.id || crypto.randomUUID(),
    name: g.name || g.title || "Travel Guide",
    city: g.city || city || "Unknown",
    description: g.description || "No description available",
    image:
      g.media?.[0]?.url ||
      g.images?.[0]?.url ||
      g.image ||
      `https://source.unsplash.com/featured/?landmark,travel,${encodeURIComponent(
        city
      )}`,
    price: "Free to visit",
    date: "Always Available",
    link: g.url || "#",
  }));
}

// 🔍 LiteAPI Key Diagnostic Test
async function testLiteAPIKey() {
  const isProduction = process.env.NODE_ENV === "production";
  const url =
    "https://api.liteapi.travel/v3.0/data/hotels?city=Lisbon&countryCode=PT&limit=1";

  try {
    console.log("🔍 Testing LiteAPI key...");

    let headers;
    if (isProduction && process.env.PROD_API_KEY) {
      // Test production Standard Authentication
      headers = {
        "X-API-Key": process.env.PROD_API_KEY,
        "Content-Type": "application/json",
      };
      console.log("🔍 Testing PRODUCTION Standard Authentication...");
    } else {
      // Test sandbox authentication
      headers = {
        "X-API-Key": process.env.SAND_API_KEY,
        "Content-Type": "application/json",
      };
      console.log("🔍 Testing SANDBOX authentication...");
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(
        `❌ LiteAPI returned status ${res.status} (${res.statusText})`
      );
      console.warn(
        "⚠️ Key may be invalid, expired, or mismatched with environment."
      );
    } else {
      const data = await res.json();
      console.log(
        "✅ LiteAPI Key is valid — example hotel result:",
        data?.data?.[0]?.name || "no data"
      );
    }
  } catch (err) {
    console.error("🚨 LiteAPI key test failed:", err.message);
  }
}

testLiteAPIKey();

const express = require("express");
const app = express();
const liteApi = require("liteapi-node-sdk");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

// LiteAPI HMAC Signature Generation
function generateLiteAPISignature(method, path, publicKey, privateKey) {
  const message = `${method.toUpperCase()}:${path}`;
  const hmac = crypto.createHmac("sha256", privateKey);
  hmac.update(message);
  return hmac.digest("hex");
}

// Initialize Gemini with error handling
let genAI = null;
try {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey.trim() !== "") {
    genAI = new GoogleGenerativeAI(geminiKey);
    console.log("✅ Gemini initialized successfully");
  } else {
    console.log("⚠️ Gemini API key not found - AI features will use mock data");
  }
} catch (error) {
  console.log("⚠️ Gemini initialization failed:", error.message);
  genAI = null;
}

// Helper: call Gemini and return the text response
async function askGemini(systemPrompt, userPrompt, opts = {}) {
  const {
    model = "gemini-1.5-flash",
    temperature = 0.7,
    maxOutputTokens = 1000,
  } = opts;

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: { temperature, maxOutputTokens },
  });

  const result = await geminiModel.generateContent(userPrompt);
  let text = result.response.text();

  // Strip markdown code fences if Gemini wraps JSON in them
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  return text;
}

app.use(
  cors({
    origin: "*",
  })
);

// ✅ Enhanced environment variable loading with validation and logging
const prod_apiKey = process.env.PROD_API_KEY;
const sandbox_apiKey = process.env.SAND_API_KEY;

// ✅ Environment validation and logging for better debugging
console.log("🔧 Environment Variable Status:");
console.log(
  `  📊 Gemini API Key: ${
    process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing"
  }`
);
console.log(
  `  🏨 LiteAPI Production Key: ${prod_apiKey ? "✅ Found" : "❌ Missing"}`
);
console.log(
  `  🧪 LiteAPI Sandbox Key: ${sandbox_apiKey ? "✅ Found" : "❌ Missing"}`
);

// ✅ Validate API keys and warn about missing ones
if (!prod_apiKey || prod_apiKey === "your_production_api_key_here") {
  console.warn(
    "⚠️ LiteAPI production key missing! Hotel bookings will use mock data in production mode."
  );
}

if (!sandbox_apiKey || sandbox_apiKey === "your_sandbox_api_key_here") {
  console.warn(
    "⚠️ LiteAPI sandbox key missing! Hotel bookings will use mock data in sandbox mode."
  );
}

// ✅ Determine current mode based on available keys
const hasValidKeys =
  (prod_apiKey && prod_apiKey !== "your_production_api_key_here") ||
  (sandbox_apiKey && sandbox_apiKey !== "your_sandbox_api_key_here");
console.log(
  `  🎯 Mode: ${hasValidKeys ? "✅ Live API Mode" : "🎭 Demo Mode (Mock Data)"}`
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory cache to reduce API calls
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🎯 Cache hit for: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedResponse(key, data) {
  apiCache.set(key, {
    data: data,
    timestamp: Date.now(),
  });
  console.log(`💾 Cached response for: ${key}`);
}

// Gemini AI Endpoints for MOLLY Go

// Get travel recommendations based on mood/feeling
app.post("/api/travel-recommendations", async (req, res) => {
  try {
    const { mood, interests, budget, duration } = req.body;
    const cacheKey = `recommendations_${mood}_${interests}_${budget}_${duration}`;

    // Check cache first
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    if (!genAI) {
      const mockRecommendations = [
        {
          destination: "Lisbon",
          country: "Portugal",
          description:
            "Perfect for your adventurous spirit! Lisbon offers stunning views, delicious pastéis de nata, and vibrant street art that will ignite your creative soul.",
          bestTime: "Spring (March-May) or Fall (September-November)",
          experiences:
            "Ride the historic Tram 28, explore Alfama district, enjoy Fado music",
          costRange: "$80-150 per day",
        },
        {
          destination: "Tokyo",
          country: "Japan",
          description:
            "A sensory explosion that matches your excited mood! From neon-lit streets to peaceful temples, Tokyo offers the perfect blend of chaos and tranquility.",
          bestTime:
            "Spring (March-May) for cherry blossoms or Fall (September-November)",
          experiences:
            "Visit Senso-ji Temple, explore Harajuku, try authentic ramen",
          costRange: "$100-200 per day",
        },
      ];
      const mockResponse = {
        recommendations: mockRecommendations,
        message:
          "🎭 Demo mode: These are sample recommendations. Add your Gemini API key for personalized AI suggestions!",
      };

      setCachedResponse(cacheKey, mockResponse);

      return res.json(mockResponse);
    }

    const prompt = `Based on the user's mood: "${mood}", interests: "${interests}", budget: "${budget}", and duration: "${duration}",
    suggest 3-5 amazing destinations where they can find joy, festivals, celebrations, or experiences that match their feelings.

    For each destination, provide:
    1. Destination name and country
    2. Why it matches their mood/interests (2-3 sentences)
    3. Best time to visit
    4. 2-3 specific experiences or events to look for
    5. Estimated cost range

    Make it warm, inspiring, and focused on emotional experiences rather than just tourist attractions.
    Format as a JSON array of objects with: destination, country, description, bestTime, experiences, costRange`;

    const text = await askGemini(
      "You are MOLLY Go, a warm and inspiring travel expert who helps people discover joy through travel experiences.",
      prompt,
      { temperature: 0.7, maxOutputTokens: 1000 }
    );

    const recommendations = JSON.parse(text);
    const response = { recommendations };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error("Error getting travel recommendations:", error);

    if (error.status === 429) {
      console.log("⚠️ Gemini rate limit - using mock data");
    }
    res.status(500).json({ error: "Failed to get travel recommendations" });
  }
});

// Generate personalized travel itinerary
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, duration, interests, mood } = req.body;

    const prompt = `Create a personalized travel itinerary for ${duration} days in ${destination}.
    Focus on experiences that match the mood: "${mood}" and interests: "${interests}".
    
    Include:
    1. Daily schedule with 2-3 activities per day
    2. Local festivals, celebrations, or cultural events to attend
    3. Hidden gems and local experiences
    4. Food recommendations
    5. Transportation tips
    6. Budget-friendly and splurge options
    
    Make it inspiring and focused on creating joyful memories.
    Format as a JSON object with days array containing: day, activities, highlights, tips, estimatedCost`;

    const text = await askGemini(
      "You are MOLLY Go, creating personalized travel experiences focused on joy and authentic local culture.",
      prompt,
      { temperature: 0.8, maxOutputTokens: 1500 }
    );

    const itinerary = JSON.parse(text);
    res.json({ itinerary });
  } catch (error) {
    console.error("Error generating itinerary:", error);

    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

// Get local events and festivals for a destination
app.post("/api/local-events", async (req, res) => {
  try {
    if (!genAI) {
      const mockEvents = [
        {
          name: "Sunset Jazz Festival",
          date: "Every Friday 6-10 PM",
          description:
            "Local jazz musicians perform against the backdrop of a beautiful sunset. Bring a blanket and enjoy the music!",
          location: "Central Park Amphitheater",
          cost: "Free",
          specialNote:
            "Perfect for a romantic evening or peaceful solo experience",
        },
        {
          name: "Street Art Walking Tour",
          date: "Every Saturday 2-4 PM",
          description:
            "Discover hidden murals and street art with local artists as your guides. Learn the stories behind each piece.",
          location: "Downtown Arts District",
          cost: "$25 per person",
          specialNote: "Great for photography enthusiasts and art lovers",
        },
      ];
      return res.json({ events: mockEvents });
    }

    const { destination, date } = req.body;

    const prompt = `Find local events, festivals, celebrations, or cultural experiences happening in ${destination} around ${date}.

    Focus on:
    1. Traditional festivals and cultural celebrations
    2. Local music, art, or food events
    3. Community gatherings and street festivals
    4. Seasonal celebrations
    5. Hidden local experiences tourists often miss

    For each event, provide: name, date, description, location, cost, and why it's special.
    Format as a JSON array of objects with: name, date, description, location, cost, specialNote`;

    const text = await askGemini(
      "You are MOLLY Go, specializing in finding authentic local events and cultural experiences.",
      prompt,
      { temperature: 0.6, maxOutputTokens: 800 }
    );

    const events = JSON.parse(text);
    res.json({ events });
  } catch (error) {
    console.error("Error getting local events:", error);

    res.status(500).json({ error: "Failed to get local events" });
  }
});

// NEW ENDPOINTS FOR ENHANCED MOLLY GO FUNCTIONALITY

// Search for experiences by mood/feeling
app.post("/api/experience-search", async (req, res) => {
  try {
    const { mood, location, budget, duration } = req.body;

    if (!genAI) {
      const mockExperiences = [
        {
          name: "Sunrise Meditation Hike",
          type: "Wellness",
          description:
            "Start your day with mindfulness and nature. Perfect for finding inner peace.",
          duration: "3 hours",
          cost: "$45",
          location: "Mountain View Trail",
          moodMatch: "peaceful, reflective, rejuvenating",
        },
        {
          name: "Underground Food Tour",
          type: "Culinary Adventure",
          description:
            "Explore hidden local eateries and taste authentic flavors most tourists miss.",
          duration: "4 hours",
          cost: "$85",
          location: "Historic District",
          moodMatch: "adventurous, curious, excited",
        },
      ];
      return res.json({ experiences: mockExperiences });
    }

    const prompt = `Find unique experiences in ${location} that match the mood: "${mood}" with budget: "${budget}" and duration: "${duration}".

    Focus on:
    1. Authentic local experiences
    2. Activities that match the emotional state
    3. Hidden gems and off-the-beaten-path options
    4. Cultural immersion opportunities

    Format as JSON array with: name, type, description, duration, cost, location, moodMatch`;

    const text = await askGemini(
      "You are MOLLY Go, expert in matching experiences to emotional states and travel desires.",
      prompt,
      { temperature: 0.7, maxOutputTokens: 600 }
    );

    const experiences = JSON.parse(text);
    res.json({ experiences });
  } catch (error) {
    console.error("Error searching experiences:", error);
    res.status(500).json({ error: "Failed to search experiences" });
  }
});

// Get destination insights and tips
// --------- NEW PROXY ROUTES ---------

// Hotels
// ✅ LiteAPI Diagnostics Route
app.get("/api/diag/liteapi", diagLiteAPI);

// ✅ Environment Variables Route for Client
app.get("/api/env", (req, res) => {
  res.json({
    VITE_LITEAPI_KEY: process.env.VITE_LITEAPI_KEY,
    VITE_LITEAPI_URL: process.env.VITE_LITEAPI_URL,
  });
});

app.get("/api/hotels", async (req, res) => {
  const { city = "", countryCode = "" } = req.query;

  // 🔍 COMPREHENSIVE DEBUG LOGGING
  console.log("--- HOTEL SEARCH DEBUG ---");
  console.log("City:", city);
  console.log("Country Code:", countryCode);
  console.log("API Key loaded:", !!apiKey);
  console.log("API Key prefix:", apiKey?.slice(0, 8) + "...");
  console.log("LITEAPI_BASE:", LITEAPI_BASE);

  // Check for API key before making request
  if (!apiKey) {
    console.log("❌ No API key found");
    return res.status(401).json({
      error: "LiteAPI key missing",
      message: "Please add your LITEAPI_KEY to .env",
      city: city,
      items: [],
    });
  }

  try {
    // ✅ Live LiteAPI key authentication enabled — mock fallback removed (21 Oct 2025)
    // Use correct LiteAPI v3.0 data endpoint
    console.log("🌍 Making LiteAPI request with params:", {
      cityName: city,
      countryCode: countryCode,
      limit: 10,
    });

    const raw = await fetchLite("/data/hotels", {
      params: {
        cityName: city,
        countryCode: countryCode,
        limit: 10,
      },
    });

    // 🔍 DIAGNOSTIC: Log the full raw API response to identify image fields
    console.log("🔍 RAW LITEAPI HOTEL RESPONSE:");
    console.log("Full response structure:", JSON.stringify(raw, null, 2));

    // Parse the response data
    const hotels = raw?.data || raw?.results || raw?.items || [];
    console.log("📦 Raw LiteAPI keys:", Object.keys(raw || {}));
    console.log("🏨 Parsed hotel count:", hotels.length);

    // Check if we have valid hotel data
    if (!raw || hotels.length === 0) {
      console.warn(
        `⚠️ No hotels found for "${city}" — possibly unsupported in sandbox.`
      );
      console.log("🔍 Raw response keys:", Object.keys(raw || {}));
      console.log("🔍 Raw response data:", raw);
      return res.status(404).json({
        city,
        items: [],
        message: `No hotels found for ${city}. Check API response in console.`,
        debug: {
          hasRaw: !!raw,
          rawKeys: Object.keys(raw || {}),
          hotelCount: hotels.length,
        },
      });
    }

    // Log the first hotel object in detail
    const firstHotel = raw?.data?.[0] ?? raw?.items?.[0];
    if (firstHotel) {
      console.log("🔍 FIRST HOTEL OBJECT:");
      console.log("Hotel keys:", Object.keys(firstHotel));
      console.log("Full hotel object:", JSON.stringify(firstHotel, null, 2));

      // Check for image-related fields
      console.log("🔍 IMAGE FIELD ANALYSIS:");
      console.log("media:", firstHotel.media);
      console.log("imageUrl:", firstHotel.imageUrl);
      console.log("photos:", firstHotel.photos);
      console.log("images:", firstHotel.images);
      console.log("image:", firstHotel.image);
      console.log("photo_main:", firstHotel.photo_main);
      console.log("photoUrl:", firstHotel.photoUrl);
    }

    logLite("hotels.raw", raw?.data?.[0] ?? raw?.items?.[0] ?? raw);

    const list = hotels
      .map((h) => normalizeHotel(h, city))
      .filter((h) => h.name);

    // 🔍 DIAGNOSTIC: Log normalized hotel data with image fields
    if (list.length > 0) {
      const firstNormalized = list[0];
      console.log("🔍 NORMALIZED HOTEL DATA (first hotel):");
      console.log("  - name:", firstNormalized.name);
      console.log("  - image field:", firstNormalized.image);
      console.log("  - has image:", !!firstNormalized.image);
      console.log("  - all keys:", Object.keys(firstNormalized));
    }

    console.log(`✅ Returning ${list.length} hotels for ${city}`);
    console.log("✅ Hotels fetched successfully:", list?.length || 0);
    res.json({ city, items: list });
  } catch (err) {
    console.error("HOTELS_ERROR", err);
    console.log("🔍 Error details:", {
      message: err.message,
      stack: err.stack?.split("\n")[0],
      name: err.name,
    });

    // ✅ Live LiteAPI fetch enabled — mock fallback removed (21 Oct 2025)
    // Check for specific API errors
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      console.error("❌ Invalid LiteAPI key or missing header.");
      return res.status(401).json({
        error: "Invalid LiteAPI key",
        message: "Please check your LiteAPI key configuration",
        city: city,
        items: [],
      });
    }

    if (err.message.includes("403") || err.message.includes("Forbidden")) {
      return res.status(403).json({
        error: "LiteAPI access forbidden",
        message: "Please check your API key permissions",
        city: city,
        items: [],
      });
    }

    // Check for server errors
    if (err.message.includes("400") || err.message.includes("Bad Request")) {
      return res.status(400).json({
        error: "Bad Request",
        message: `Invalid request for ${city}. Check city name and country code.`,
        city: city,
        items: [],
        details: err.message,
      });
    }

    // Return empty results with detailed error info
    return res.json({
      city,
      items: [],
      error: "Unable to fetch hotels from LiteAPI",
      details: err.message || "No message",
      fullError: err, // ✅ log the full raw error
      debug: {
        errorType: err.name,
        stack: err.stack?.split("\n").slice(0, 3),
        apiKeyPrefix: apiKey?.slice(0, 8) + "...",
        hasApiKey: !!apiKey,
      },
    });
  }
});

// Events / activities - LiteAPI implementation with guaranteed data
app.get("/api/events", async (req, res) => {
  const { city, countryCode } = req.query;
  const API_KEY = process.env.PROD_API_KEY;
  const BASE_URL = "https://api.liteapi.travel/v3.0/data";

  async function fetchLite(endpoint) {
    const url = `${BASE_URL}/${endpoint}?cityName=${city}&countryCode=${countryCode}&limit=10`;
    console.log("📡 Fetching:", url);
    const response = await fetch(url, {
      headers: { "X-API-Key": API_KEY, accept: "application/json" },
    });
    const data = await response.json();
    return data;
  }

  try {
    console.log(`🎪 Fetching events for ${city} (${countryCode})`);
    let data = await fetchLite("events");

    // Check if events data is empty
    const hasData = Array.isArray(data.data) && data.data.length > 0;

    if (!hasData) {
      console.warn("⚠️ No events found, switching to festivals...");
      data = await fetchLite("festivals");
    }

    const hasFestivals = Array.isArray(data.data) && data.data.length > 0;

    if (!hasFestivals) {
      console.warn("⚠️ No festivals found, switching to activities...");
      data = await fetchLite("activities");
    }

    const hasActivities = Array.isArray(data.data) && data.data.length > 0;

    // Fallback: If all empty, create mock data
    if (!hasActivities) {
      console.warn(
        "⚠️ No results from LiteAPI, returning mock data for display"
      );
      data = {
        data: [
          {
            name: `City Tour Experience in ${city}`,
            city,
            country: countryCode,
            description:
              "Join a local guide for a walking tour and discover hidden gems.",
            date: "2024-07-15",
            url: "#",
          },
          {
            name: `Local Food Festival in ${city}`,
            city,
            country: countryCode,
            description: "Taste the best local dishes and street food flavors.",
            date: "2024-08-10",
            url: "#",
          },
        ],
      };
    }

    console.log("✅ Final events count:", data.data.length);
    res.json(data);
  } catch (err) {
    console.error("💥 Events route error:", err);
    res.json({ error: "LiteAPI events fetch failed", details: err.message });
  }
});

// Simple guide (can remain static if you like)
app.get("/api/guide", (req, res) => {
  const { city = "" } = req.query;
  res.json({
    city,
    blocks: [
      {
        title: "Top Attractions",
        items: ["Historic landmarks", "Museums", "Local markets"],
      },
      {
        title: "Local Food",
        items: ["Traditional cuisine", "Street food", "Specialties"],
      },
      {
        title: "Best Time to Visit",
        items: ["Year-round", "Peak festivals", "Mild seasons"],
      },
    ],
  });
});

app.get("/api/destination-insights/:destination", async (req, res) => {
  try {
    const { destination } = req.params;

    if (!genAI) {
      const mockInsights = {
        destination: destination,
        bestTime: "Spring and Fall",
        localTips: [
          "Visit local markets early morning for fresh produce",
          "Learn basic local phrases - locals appreciate the effort",
          "Try street food from busy stalls - they're usually the best",
        ],
        hiddenGems: [
          "Secret rooftop cafe with city views",
          "Underground art gallery",
          "Local music venue in historic building",
        ],
        culturalEtiquette: [
          "Dress modestly when visiting religious sites",
          "Remove shoes before entering homes",
          "Use right hand for eating and greeting",
        ],
      };
      return res.json(mockInsights);
    }

    const prompt = `Provide comprehensive insights about ${destination} for travelers:

    Include:
    1. Best time to visit
    2. Local tips and insider knowledge
    3. Hidden gems and secret spots
    4. Cultural etiquette and customs
    5. Transportation tips
    6. Budget-friendly options

    Format as JSON with: destination, bestTime, localTips, hiddenGems, culturalEtiquette, transportTips, budgetTips`;

    const text = await askGemini(
      "You are MOLLY Go, providing authentic travel insights and local knowledge.",
      prompt,
      { temperature: 0.6, maxOutputTokens: 800 }
    );

    const insights = JSON.parse(text);
    res.json(insights);
  } catch (error) {
    console.error("Error getting destination insights:", error);
    res.status(500).json({ error: "Failed to get destination insights" });
  }
});

// Search for accommodations by type and mood
app.post("/api/accommodation-search", async (req, res) => {
  try {
    const { accommodationType, mood, location, budget } = req.body;

    if (!genAI) {
      const mockAccommodations = [
        {
          name: "Boutique Wellness Retreat",
          type: "Boutique Hotel",
          description:
            "A peaceful sanctuary designed for relaxation and rejuvenation. Perfect for finding inner peace.",
          price: "$180/night",
          amenities: [
            "Spa",
            "Yoga classes",
            "Organic restaurant",
            "Meditation garden",
          ],
          moodMatch: "peaceful, relaxing, wellness-focused",
        },
        {
          name: "Adventure Basecamp",
          type: "Hostel",
          description:
            "Vibrant social atmosphere with organized outdoor activities and group adventures.",
          price: "$45/night",
          amenities: [
            "Shared kitchen",
            "Tour desk",
            "Common areas",
            "Equipment rental",
          ],
          moodMatch: "adventurous, social, energetic",
        },
      ];
      return res.json({ accommodations: mockAccommodations });
    }

    const prompt = `Find ${accommodationType} accommodations in ${location} that match mood: "${mood}" and budget: "${budget}".

    Focus on:
    1. Atmosphere that matches the emotional state
    2. Amenities that support the desired experience
    3. Location benefits for the traveler's goals
    4. Unique features and character

    Format as JSON array with: name, type, description, price, amenities, moodMatch, location`;

    const text = await askGemini(
      "You are MOLLY Go, matching accommodations to traveler moods and experiences.",
      prompt,
      { temperature: 0.7, maxOutputTokens: 600 }
    );

    const accommodations = JSON.parse(text);
    res.json({ accommodations });
  } catch (error) {
    console.error("Error searching accommodations:", error);
    res.status(500).json({ error: "Failed to search accommodations" });
  }
});

// ChatBot endpoint for natural conversation
app.post("/api/chat", async (req, res) => {
  console.log("📩 /api/chat called with:", req.body);

  const userMessage = req.body.message?.toLowerCase() || "";

  // Detect request type based on message content
  let endpoint = "hotels"; // default
  if (/events|festival|concert|show|entertainment/i.test(userMessage)) {
    endpoint = "events";
  } else if (/guide|tips|insights|local|recommendations/i.test(userMessage)) {
    endpoint = "guide";
  } else if (/hotels|accommodation|stay|book/i.test(userMessage)) {
    endpoint = "hotels";
  }

  console.log(`🎯 Detected endpoint: ${endpoint}`);

  // Country hints dictionary for automatic country detection
  const countryHints = {
    dublin: "IE",
    lisbon: "PT",
    lisabon: "PT",
    london: "GB",
    paris: "FR",
    madrid: "ES",
    berlin: "DE",
    rome: "IT",
    prague: "CZ",
    zagreb: "HR",
    dubai: "AE",
    vienna: "AT",
    "new york": "US",
    newyork: "US", // eslint-disable-line spellcheck/spell-checker
    amsterdam: "NL",
  };

  // Extract city name with improved regex
  let city = "";
  const cityRegex = /(?:in|at|for)\s+([a-zA-Z\s]+)/i;
  const match = userMessage.match(cityRegex);

  if (match && match[1]) {
    city = match[1].trim();
  } else {
    // fallback: if message itself looks like a single city name
    const singleWord = userMessage.trim().match(/^[A-Za-z\s]+$/);
    if (singleWord && singleWord[0].length > 2) {
      city = singleWord[0].trim();
    }
  }

  if (city) {
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    console.log("🌍 Detected city:", city);
  } else {
    console.warn("⚠️ Could not extract city from message:", userMessage);
  }

  // Check if city is empty and return friendly response
  if (!city || city.trim() === "") {
    return res.json({
      reply: "Please tell me which city you want to explore 😊",
    });
  }

  // Normalize and detect country automatically
  const normalizedCity = city.toLowerCase().replace(/\s+/g, "");
  const countryCode = countryHints[normalizedCity] || "GB";

  // Make direct API calls instead of redirects
  if (endpoint === "hotels") {
    try {
      console.log(`🏨 Making hotel API call for ${city}, ${countryCode}`);
      const hotelResponse = await fetch(
        `http://localhost:3000/api/hotels?city=${encodeURIComponent(
          city
        )}&countryCode=${countryCode}`
      );
      const hotelData = await hotelResponse.json();

      if (hotelData.items && hotelData.items.length > 0) {
        return res.json({
          reply: `Found ${hotelData.items.length} hotels in ${city}! 🏨`,
          hotels: hotelData.items,
          city: city,
        });
      } else {
        return res.json({
          reply: `Sorry, I couldn't find hotels in ${city}. Try a different city or check the spelling.`,
          city: city,
          debug: hotelData,
        });
      }
    } catch (error) {
      console.error("Hotel API error:", error);
      return res.json({
        reply: `Sorry, I couldn't find hotels in ${city}. There was an error: ${error.message}`,
        city: city,
      });
    }
  }

  if (endpoint === "events") {
    try {
      console.log(`🎪 Making events API call for ${city}, ${countryCode}`);
      const eventResponse = await fetch(
        `http://localhost:3000/api/events?city=${encodeURIComponent(
          city
        )}&countryCode=${countryCode}`
      );
      const eventData = await eventResponse.json();

      if (eventData.items && eventData.items.length > 0) {
        return res.json({
          reply: `Found ${eventData.items.length} events in ${city}! 🎪`,
          events: eventData.items,
          city: city,
        });
      } else {
        return res.json({
          reply: `Sorry, I couldn't find events in ${city}. Try a different city or check the spelling.`,
          city: city,
          debug: eventData,
        });
      }
    } catch (error) {
      console.error("Events API error:", error);
      return res.json({
        reply: `Sorry, I couldn't find events in ${city}. There was an error: ${error.message}`,
        city: city,
      });
    }
  }

  try {
    // Determine authentication mode based on environment
    const isProduction = process.env.NODE_ENV === "production";
    let headers, apiUrl;

    // Use LITEAPI_KEY if available, otherwise fall back to existing keys
    const apiKey =
      process.env.LITEAPI_KEY ||
      (isProduction ? process.env.PROD_API_KEY : process.env.SAND_API_KEY);

    // Check if it's an API key issue early
    if (!apiKey || apiKey === "DEMO") {
      return res.json({
        error: "MOLLY couldn't connect to LiteAPI right now",
        details: "Please try again soon",
        endpoint: endpoint,
        items: [],
      });
    }

    // Log API key presence for debugging
    console.log("🔑 API Key Status:", {
      hasKey: !!apiKey,
      keyType: apiKey
        ? apiKey.startsWith("prod_")
          ? "production"
          : "sandbox"
        : "none",
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : "missing",
    });

    if (endpoint === "hotels") {
      // Hotels endpoint
      const queryParams = new URLSearchParams({
        city: city,
        countryCode: countryCode,
        limit: "12", // Increased limit for View More functionality
      });

      apiUrl = `https://api.liteapi.travel/v3.0/data/hotels?${queryParams.toString()}`;
      headers = {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    } else if (endpoint === "events") {
      // Events endpoint (using activities as proxy)
      apiUrl = `https://api.liteapi.travel/v3.0/data/activities?city=${encodeURIComponent(
        city
      )}&countryCode=${countryCode}&limit=12`;
      headers = {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    } else if (endpoint === "guide") {
      // AI Travel Guide - use Gemini to generate content
      try {
        console.log("🧠 Generating AI Travel Guide for:", city);

        if (!genAI) throw new Error("Gemini not initialized");

        const prompt = `Write a friendly, practical travel guide about ${city}.
        Include culture, main attractions, food, and best visiting season.
        Keep tone warm and adventurous.
        Format as JSON with these fields:
        {
          "summary": "2-3 paragraph overview of the city",
          "attractions": ["attraction1", "attraction2", "attraction3"],
          "food": ["food1", "food2", "food3"],
          "bestTime": "best time to visit",
          "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
        }`;

        const aiResponse = await askGemini(
          "You are MOLLY Go, a warm and adventurous travel guide writer.",
          prompt,
          { model: "gemini-1.5-pro", temperature: 0.7, maxOutputTokens: 1500 }
        );
        console.log("🤖 Gemini response received");

        // Parse AI response (handle both JSON and text formats)
        let guideData;
        try {
          guideData = JSON.parse(aiResponse);
        } catch (parseError) {
          // If not JSON, create structured data from text
          guideData = {
            summary: aiResponse,
            attractions: ["Local landmarks", "Cultural sites", "Scenic spots"],
            food: ["Local cuisine", "Traditional dishes", "Street food"],
            bestTime: "Year-round destination",
            tips: [
              "Plan ahead",
              "Learn basic phrases",
              "Try local transport",
              "Respect local customs",
              "Keep emergency contacts",
            ],
          };
        }

        // Generate city image URL
        const cityImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(
          city
        )},landmark,travel`;

        return res.json({
          endpoint: "guide",
          items: [
            {
              name: `AI Travel Guide for ${city}`,
              description: guideData.summary,
              city: city,
              image: cityImageUrl,
              link: "#",
              price: "Free Guide",
              date: "Always Available",
              attractions: guideData.attractions,
              food: guideData.food,
              bestTime: guideData.bestTime,
              tips: guideData.tips,
            },
          ],
        });
      } catch (guideError) {
        console.error("❌ Gemini guide error:", guideError.message);

        // Fallback to static guide if Gemini fails
        const cityImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(
          city
        )},landmark,travel`;

        return res.json({
          endpoint: "guide",
          items: [
            {
              name: `Travel Guide for ${city}`,
              description: `Welcome to ${city}! This beautiful destination offers a rich blend of culture, history, and modern attractions. Whether you're interested in exploring historic landmarks, enjoying local cuisine, or experiencing the vibrant local culture, ${city} has something special for every traveler. The city's unique charm and welcoming atmosphere make it a perfect destination for both first-time visitors and returning travelers.`,
              city: city,
              image: cityImageUrl,
              link: "#",
              price: "Free Guide",
              date: "Always Available",
              attractions: [
                "Historic landmarks",
                "Cultural museums",
                "Local markets",
              ],
              food: ["Traditional cuisine", "Local specialties", "Street food"],
              bestTime: "Year-round destination",
              tips: [
                "Plan your itinerary",
                "Learn local customs",
                "Try public transport",
                "Keep emergency contacts",
                "Respect local culture",
              ],
            },
          ],
        });
      }
    } else {
      // Default attractions endpoint
      apiUrl = `https://api.liteapi.travel/v3.0/data/attractions?city=${encodeURIComponent(
        city
      )}&countryCode=${countryCode}&limit=12`;
      headers = {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    }

    console.log(`🌍 Fetching ${endpoint} for city:`, city);
    console.log("🌐 Fetching:", apiUrl);
    console.log("🔑 Headers:", Object.keys(headers));

    // Add connection timeout wrapper
    const controller = new AbortController();
    const connectionTimeout = setTimeout(() => {
      console.log("⏰ LiteAPI connection timeout after 8 seconds");
      controller.abort();
    }, 8000);

    try {
      const response = await fetch(apiUrl, {
        headers: headers,
        signal: controller.signal,
        method: "GET",
      });

      clearTimeout(connectionTimeout);

      console.log("📡 LiteAPI Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ LiteAPI HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log("📄 Response text length:", responseText.length);

      if (!responseText || responseText.trim() === "") {
        console.warn("⚠️ LiteAPI returned empty response");
        return res.json({
          endpoint: endpoint,
          items: [],
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("✅ LiteAPI response parsed successfully");
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError.message);
        console.error(
          "📄 Response text:",
          responseText.substring(0, 200) + "..."
        );
        return res.json({
          endpoint: endpoint,
          items: [],
        });
      }

      // Process the response data
      if (data?.data?.length) {
        console.log(
          `✅ LiteAPI returned ${data.data.length} ${endpoint} for ${city}`
        );

        // 🔍 DIAGNOSTIC: Log raw hotel data for chat endpoint
        if (endpoint === "hotels" && data.data && data.data.length > 0) {
          console.log("🔍 CHAT ENDPOINT - RAW HOTEL DATA:");
          console.log(
            "First hotel from chat endpoint:",
            JSON.stringify(data.data[0], null, 2)
          );
          console.log("Hotel keys:", Object.keys(data.data[0]));

          // Check for image-related fields in chat endpoint
          const firstHotel = data.data[0];
          console.log("🔍 CHAT ENDPOINT - IMAGE FIELD ANALYSIS:");
          console.log("media:", firstHotel.media);
          console.log("imageUrl:", firstHotel.imageUrl);
          console.log("photos:", firstHotel.photos);
          console.log("images:", firstHotel.images);
          console.log("image:", firstHotel.image);
          console.log("photo_main:", firstHotel.photo_main);
          console.log("photoUrl:", firstHotel.photoUrl);
        }

        // Transform data using normalization functions
        let items = [];
        if (endpoint === "hotels") {
          items = normalizeHotelData(data.data || [], city);
        } else if (endpoint === "events") {
          items = normalizeEventData(data.data || [], city);
        } else {
          items = normalizeGuideData(data.data || [], city);
        }

        // Log normalized data for debugging
        console.log(`📊 Normalized ${endpoint} data:`, items.length, "items");

        return res.json({
          endpoint: endpoint,
          items: items,
        });
      }

      // Log warning for empty LiteAPI response
      console.warn(`⚠️ LiteAPI returned no ${endpoint} data for:`, city);

      // Return empty results with proper structure
      return res.json({
        endpoint: endpoint,
        items: [],
      });
    } catch (fetchError) {
      clearTimeout(connectionTimeout);
      console.error("❌ LiteAPI connection failed:", fetchError.message);

      if (fetchError.name === "AbortError") {
        throw new Error(
          "Connection timeout - LiteAPI server did not respond within 8 seconds"
        );
      }

      throw fetchError;
    }
  } catch (err) {
    console.error(`❌ LiteAPI ${endpoint} fetch failed:`, err);
    console.error("❌ LiteAPI Error:", err.message);
    console.error("❌ Error details:", {
      message: err.message,
      endpoint: endpoint,
      city: city,
    });

    // Check for specific API errors
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      return res.json({
        error: "MOLLY couldn't connect to LiteAPI right now",
        details: "Please try again soon",
        endpoint: endpoint,
        items: [],
      });
    }

    if (err.message.includes("403") || err.message.includes("Forbidden")) {
      return res.json({
        error: "MOLLY couldn't connect to LiteAPI right now",
        details: "Please try again soon",
        endpoint: endpoint,
        items: [],
      });
    }

    if (err.message.includes("429") || err.message.includes("rate limit")) {
      return res.json({
        error: "MOLLY couldn't connect to LiteAPI right now",
        details: "Please try again soon",
        endpoint: endpoint,
        items: [],
      });
    }

    if (err.message.includes("timeout") || err.message.includes("AbortError")) {
      return res.json({
        error: "MOLLY couldn't connect to LiteAPI right now",
        details: "Please try again soon",
        endpoint: endpoint,
        items: [],
      });
    }

    // Generic error
    return res.json({
      error: "MOLLY couldn't connect to LiteAPI right now",
      details: "Please try again soon",
      endpoint: endpoint,
      items: [],
    });
  }
});

// Get weather and seasonal recommendations
app.get("/api/weather-insights/:destination", async (req, res) => {
  try {
    const { destination } = req.params;
    const { month } = req.query;

    if (!genAI) {
      const mockWeatherInsights = {
        destination: destination,
        month: month || "current",
        temperature: "22°C (72°F)",
        weather: "Partly cloudy",
        packingTips: [
          "Light layers for temperature changes",
          "Comfortable walking shoes",
          "Umbrella for occasional showers",
        ],
        seasonalActivities: [
          "Outdoor festivals and concerts",
          "Beach activities and water sports",
          "Hiking and nature exploration",
        ],
        seasonalEvents: [
          "Annual Music Festival",
          "Local Food Fair",
          "Art Walk Weekend",
        ],
      };
      return res.json(mockWeatherInsights);
    }

    const prompt = `Provide weather insights for ${destination} in ${
      month || "current month"
    }:

    Include:
    1. Typical temperature and weather conditions
    2. Packing recommendations
    3. Seasonal activities available
    4. Local events happening during this time
    5. Weather-related travel tips

    Format as JSON with: destination, month, temperature, weather, packingTips, seasonalActivities, seasonalEvents, tips`;

    const text = await askGemini(
      "You are MOLLY Go, providing weather-aware travel planning and seasonal insights.",
      prompt,
      { temperature: 0.5, maxOutputTokens: 500 }
    );

    const weatherInsights = JSON.parse(text);
    res.json(weatherInsights);
  } catch (error) {
    console.error("Error getting weather insights:", error);
    res.status(500).json({ error: "Failed to get weather insights" });
  }
});

// Mock hotel data for demonstration
const mockHotels = [
  {
    hotel: {
      id: "hotel_001",
      name: "The Grand MOLLY Hotel",
      address: "123 Joy Street, Downtown",
      rating: "4.8",
      description:
        "A luxurious hotel where every stay is filled with happiness and adventure. Perfect for travelers seeking joy and comfort.",
    },
    roomTypes: [
      {
        name: "Joy Suite",
        offerId: "offer_001",
        rates: [
          {
            name: "Early Bird Special",
            retailRate: {
              total: { amount: 299, currency: "USD" },
            },
          },
        ],
      },
      {
        name: "Adventure Room",
        offerId: "offer_002",
        rates: [
          {
            name: "Standard Rate",
            retailRate: {
              total: { amount: 199, currency: "USD" },
            },
          },
        ],
      },
    ],
  },
  {
    hotel: {
      id: "hotel_002",
      name: "Sunset Paradise Resort",
      address: "456 Beach Boulevard, Coastal Area",
      rating: "4.6",
      description:
        "Wake up to stunning ocean views and fall asleep to the sound of waves. Your perfect beach getaway awaits!",
    },
    roomTypes: [
      {
        name: "Ocean View Suite",
        offerId: "offer_003",
        rates: [
          {
            name: "Beach Package",
            retailRate: {
              total: { amount: 399, currency: "USD" },
            },
          },
        ],
      },
    ],
  },
  {
    hotel: {
      id: "hotel_003",
      name: "Urban Explorer Inn",
      address: "789 City Center Plaza",
      rating: "4.4",
      description:
        "Located in the heart of the city, perfect for exploring local culture, festivals, and hidden gems.",
    },
    roomTypes: [
      {
        name: "City Explorer Room",
        offerId: "offer_004",
        rates: [
          {
            name: "Weekend Special",
            retailRate: {
              total: { amount: 149, currency: "USD" },
            },
          },
        ],
      },
    ],
  },
];

// Existing hotel booking endpoints
app.get("/search-hotels", async (req, res) => {
  console.log("Search endpoint hit");
  const { checkin, checkout, adults, city, countryCode, environment } =
    req.query;

  // ✅ Enhanced API key validation with environment-specific logging
  const apiKey = environment == "sandbox" ? sandbox_apiKey : prod_apiKey;
  const environmentType = environment == "sandbox" ? "Sandbox" : "Production";

  if (
    !apiKey ||
    apiKey === "your_production_api_key_here" ||
    apiKey === "your_sandbox_api_key_here"
  ) {
    console.log(
      `🔧 Using mock hotel data for ${environmentType} mode - add your LiteAPI ${environmentType.toLowerCase()} key to .env for real results`
    );

    // Return mock data with a delay to simulate API call
    setTimeout(() => {
      res.json({
        rates: mockHotels,
        message:
          "🎭 Demo mode: These are sample hotels. Add your LiteAPI keys to .env for real results!",
      });
    }, 1000);
    return;
  }

  const sdk = liteApi(apiKey);

  try {
    const response = await sdk.getHotels(countryCode, city, 0, 10);
    const data = (await response).data;
    const hotelIds = data.map((hotel) => hotel.id);
    const rates = (
      await sdk.getFullRates({
        hotelIds: hotelIds,
        occupancies: [{ adults: parseInt(adults, 10) }],
        currency: "USD",
        guestNationality: "US",
        checkin: checkin,
        checkout: checkout,
      })
    ).data;
    rates.forEach((rate) => {
      rate.hotel = data.find((hotel) => hotel.id === rate.hotelId);
    });

    res.json({ rates });
  } catch (error) {
    console.error("Error searching for hotels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/search-rates", async (req, res) => {
  console.log("Rate endpoint hit");
  const { checkin, checkout, adults, hotelId, environment } = req.query;

  // ✅ Enhanced API key validation for rates endpoint
  const apiKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  const environmentType = environment === "sandbox" ? "Sandbox" : "Production";

  if (
    !apiKey ||
    apiKey === "your_production_api_key_here" ||
    apiKey === "your_sandbox_api_key_here"
  ) {
    console.log(
      `🔧 LiteAPI ${environmentType} key missing for rates endpoint - using fallback`
    );
    return res.status(503).json({
      error: `LiteAPI ${environmentType.toLowerCase()} key not configured`,
      message: "Please add your LiteAPI key to .env file",
    });
  }

  const sdk = liteApi(apiKey);

  try {
    // Fetch rates only for the specified hotel
    const rates = (
      await sdk.getFullRates({
        hotelIds: [hotelId],
        occupancies: [{ adults: parseInt(adults, 10) }],
        currency: "USD",
        guestNationality: "US",
        checkin: checkin,
        checkout: checkout,
      })
    ).data;

    // Fetch hotel details
    const hotelsResponse = await sdk.getHotelDetails(hotelId);
    const hotelInfo = hotelsResponse.data;

    // Prepare the response data
    const rateInfo = rates.map((hotel) =>
      hotel.roomTypes.flatMap((roomType) => {
        // Define the board types we're interested in
        const boardTypes = ["RO", "BI"];

        // Filter rates by board type and sort by refundable tag
        return boardTypes
          .map((boardType) => {
            const filteredRates = roomType.rates.filter(
              (rate) => rate.boardType === boardType
            );

            // Sort to prioritize 'RFN' over 'NRFN'
            const sortedRates = filteredRates.sort((a, b) => {
              if (
                a.cancellationPolicies.refundableTag === "RFN" &&
                b.cancellationPolicies.refundableTag !== "RFN"
              ) {
                return -1; // a before b
              } else if (
                b.cancellationPolicies.refundableTag === "RFN" &&
                a.cancellationPolicies.refundableTag !== "RFN"
              ) {
                return 1; // b before a
              }
              return 0; // no change in order
            });

            // Return the first rate meeting the criteria if it exists
            if (sortedRates.length > 0) {
              const rate = sortedRates[0];
              return {
                rateName: rate.name,
                offerId: roomType.offerId,
                board: rate.boardName,
                refundableTag: rate.cancellationPolicies.refundableTag,
                retailRate: rate.retailRate.total[0].amount,
                originalRate: rate.retailRate.suggestedSellingPrice[0].amount,
              };
            }
            return null; // or some default object if no rates meet the criteria
          })
          .filter((rate) => rate !== null); // Filter out null values if no rates meet the criteria
      })
    );
    res.json({ hotelInfo, rateInfo });
  } catch (error) {
    console.error("Error fetching rates:", error);
    res.status(500).json({ error: "No availability found" });
  }
});

app.post("/prebook", async (req, res) => {
  //console.log(req.body);
  const { rateId, environment, voucherCode } = req.body;

  // ✅ Enhanced API key validation for prebook endpoint
  const apiKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  const environmentType = environment === "sandbox" ? "Sandbox" : "Production";

  if (
    !apiKey ||
    apiKey === "your_production_api_key_here" ||
    apiKey === "your_sandbox_api_key_here"
  ) {
    console.log(
      `🔧 LiteAPI ${environmentType} key missing for prebook endpoint`
    );
    return res.status(503).json({
      error: `LiteAPI ${environmentType.toLowerCase()} key not configured`,
      message: "Please add your LiteAPI key to .env file",
    });
  }

  const sdk = liteApi(apiKey);
  //console.log(apiKey, "apiKey");
  const bodyData = {
    offerId: rateId,
    usePaymentSdk: true,
  };

  // Conditionally add the voucherCode if it exists in the request body
  if (voucherCode) {
    bodyData.voucherCode = voucherCode;
  }

  try {
    // Call the SDK's prebook method and handle the response
    sdk
      .preBook(bodyData)
      .then((response) => {
        res.json({ success: response }); // Send response back to the client
      })
      .catch((err) => {
        console.error("Error:", err); // Print the error if any
        res.status(500).json({ error: "Internal Server Error" }); // Send error response
      });
  } catch (err) {
    console.error(" Prebook error:", err); // Handle errors related to SDK usage
    res.status(500).json({ error: "Internal Server Error" }); // Send error response
  }
});

app.get("/book", (req, res) => {
  console.log(req.query);
  const {
    prebookId,
    guestFirstName,
    guestLastName,
    guestEmail,
    transactionId,
    environment,
  } = req.query;

  // ✅ Enhanced API key validation for booking endpoint
  const apiKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  const environmentType = environment === "sandbox" ? "Sandbox" : "Production";

  if (
    !apiKey ||
    apiKey === "your_production_api_key_here" ||
    apiKey === "your_sandbox_api_key_here"
  ) {
    console.log(
      `🔧 LiteAPI ${environmentType} key missing for booking endpoint`
    );
    return res
      .status(503)
      .send(
        `LiteAPI ${environmentType.toLowerCase()} key not configured. Please add your LiteAPI key to .env file.`
      );
  }

  const sdk = liteApi(apiKey);

  // Prepare the booking data
  const bodyData = {
    holder: {
      firstName: guestFirstName,
      lastName: guestLastName,
      email: guestEmail,
    },
    payment: {
      method: "TRANSACTION_ID",
      transactionId: transactionId,
    },
    prebookId: prebookId,
    guests: [
      {
        occupancyNumber: 1,
        remarks: "",
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
      },
    ],
  };

  console.log(bodyData);

  sdk
    .book(bodyData)
    .then((data) => {
      if (!data || data.error) {
        // Validate if there's any error in the data
        throw new Error(
          "Error in booking data: " +
            (data.error ? data.error.message : "Unknown error")
        );
      }

      console.log(data);

      res.send(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        h1 {
            color: #333;
        }
        .booking-details, .room-details, .policy-details {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        .header {
            font-weight: bold;
            color: #444;
        }
    </style>
</head>
<body>
    <h1>Booking Confirmation</h1>
    <div class="booking-details">
        <div class="header">Booking Information:</div>
        <p>Booking ID: ${data.data.bookingId}</p>
        <p>Supplier Name: ${data.data.supplierBookingName} (${
        data.data.supplier
      })</p>
        <p>Status: ${data.data.status}</p>
        <p>Check-in: ${data.data.checkin}</p>
        <p>Check-out: ${data.data.checkout}</p>
        <p>Hotel: ${data.data.hotel.name} (ID: ${data.data.hotel.hotelId})</p>
    </div>

    <div class="room-details">
        <div class="header">Room Details:</div>
        <p>Room Type: ${data.data.bookedRooms[0].roomType.name}</p>
        <p>Rate (Total): $${
          data.data.bookedRooms[0].rate.retailRate.total.amount
        } ${data.data.bookedRooms[0].rate.retailRate.total.currency}</p>
        <p>Occupancy: ${data.data.bookedRooms[0].adults} Adult(s), ${
        data.data.bookedRooms[0].children
      } Child(ren)</p>
        <p>Guest Name: ${data.data.bookedRooms[0].firstName} ${
        data.data.bookedRooms[0].lastName
      }</p>
    </div>
<div class="policy-details">
    <div class="header">Cancellation Policy:</div>
    <p>Cancel By: ${
      data.data.cancellationPolicies &&
      data.data.cancellationPolicies.cancelPolicyInfos &&
      data.data.cancellationPolicies.cancelPolicyInfos[0]
        ? data.data.cancellationPolicies.cancelPolicyInfos[0].cancelTime
        : "Not specified"
    }</p>
    <p>Cancellation Fee: ${
      data.data.cancellationPolicies &&
      data.data.cancellationPolicies.cancelPolicyInfos &&
      data.data.cancellationPolicies.cancelPolicyInfos[0]
        ? `$${data.data.cancellationPolicies.cancelPolicyInfos[0].amount}`
        : "Not specified"
    }</p>
    <p>Remarks: ${data.data.remarks || "No additional remarks."}</p>
</div>

    <a href="/"><button>Back to Hotels</button></a>
</body>
</html>
      `);
    })
    .catch((err) => {
      console.error("Error during booking:", err);
      res.status(500).send(`Failed to book: ${err.message}`);
    });
});

// Serve the client-side application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ✅ Enhanced API configuration endpoint with proper fallback logic
app.get("/api/config", (req, res) => {
  // Use sandbox key as primary, fallback to production key, then demo key
  const primaryKey = sandbox_apiKey || prod_apiKey || "sand_f3a10xxxxxxxxxxxxx";
  const keySource = sandbox_apiKey
    ? "sandbox"
    : prod_apiKey
    ? "production"
    : "demo";

  console.log(`🔧 Serving API config with ${keySource} key`);

  res.json({
    LITEAPI_KEY: primaryKey,
    LITEAPI_URL: "https://api.liteapi.travel/v3.0",
    KEY_SOURCE: keySource, // For debugging purposes
    IS_DEMO: keySource === "demo",
  });
});

app.use(express.static(path.join(__dirname, "../client")));

const port = 3000;

// --- Proxy route for LiteAPI ---

app.get("/proxy/hotels", async (req, res) => {
  const { city = "Lisbon", countryCode = "US" } = req.query;
  console.log("🏨 /proxy/hotels called with:", req.query);

  try {
    console.log(`🔎 Fetching hotels for ${city}, ${countryCode}`);
    console.log(
      `🔑 Using key: ${process.env.SAND_API_KEY ? "✅ Found" : "❌ Missing"}`
    );

    // Add timeout wrapper for LiteAPI request
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("⏰ LiteAPI request timeout")), 10000)
    );

    const fetchPromise = fetch(
      `https://api.liteapi.travel/v3.0/data/hotels?countryCode=${countryCode}&cityName=${encodeURIComponent(
        city
      )}&limit=5`,
      {
        method: "GET",
        headers: {
          "X-API-Key": process.env.SAND_API_KEY, // ✅ Correct header
          Accept: "application/json", // ✅ Correct format
        },
      }
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    console.log("📡 LiteAPI Response status:", response.status);

    if (!response.ok) {
      console.error(
        `❌ LiteAPI error: ${response.status} - ${response.statusText}`
      );
      if (response.status === 401) {
        console.error("❌ Invalid LiteAPI key or missing header.");
        return res.status(401).json({
          error: "Invalid LiteAPI key",
          message: "Please check your LiteAPI key configuration",
        });
      }

      if (response.status === 403) {
        return res.status(403).json({
          error: "LiteAPI access forbidden",
          message: "Please check your API key permissions",
        });
      }
      throw new Error(`LiteAPI responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ LiteAPI response received:", data);
    console.log("🏨 LiteAPI hotel data:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error);

    // ✅ Live LiteAPI fetch enabled — mock fallback removed (21 Oct 2025)
    return res.status(500).json({
      error: "LiteAPI connection failed",
      message: error.message,
      city: city,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(
    `📊 Gemini Integration: ${genAI ? "✅ Active" : "❌ Disabled (Mock Mode)"}`
  );
  console.log(
    `🏨 LiteAPI Integration: ${
      hasValidKeys ? "✅ Active" : "❌ Disabled (Mock Mode)"
    }`
  );
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📁 Static files served from: ${path.join(__dirname, "../client")}`
  );
});
