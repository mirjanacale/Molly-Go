// ✅ CRITICAL: Load .env before anything else
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
console.log("🧪 ENV CHECK:");
console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"
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
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "not set",
});

if (!process.env.SAND_API_KEY || !process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing required API keys in .env file!");
  // Add fallback DEMO mode
  if (!process.env.SAND_API_KEY) {
    console.warn("⚠️ No LiteAPI sandbox key found — running in DEMO mode");
    process.env.SAND_API_KEY = "DEMO";
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ No OpenAI key found — running in DEMO mode");
    process.env.OPENAI_API_KEY = "DEMO";
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
const OpenAI = require("openai");
const crypto = require("crypto");

// LiteAPI HMAC Signature Generation
function generateLiteAPISignature(method, path, publicKey, privateKey) {
  const message = `${method.toUpperCase()}:${path}`;
  const hmac = crypto.createHmac("sha256", privateKey);
  hmac.update(message);
  return hmac.digest("hex");
}

// Initialize OpenAI with error handling
let openai = null;
try {
  if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your_openai_api_key_here" &&
    process.env.OPENAI_API_KEY.trim() !== ""
  ) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("✅ OpenAI initialized successfully");
  } else {
    console.log("⚠️ OpenAI API key not found - AI features will use mock data");
  }
} catch (error) {
  console.log("⚠️ OpenAI initialization failed:", error.message);
  openai = null;
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
  `  📊 OpenAI API Key: ${
    process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing"
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

// OpenAI Endpoints for MOLLY Go

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

    if (!openai) {
      // Return mock data when OpenAI is not available
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
          "🎭 Demo mode: These are sample recommendations. Add your OpenAI API key for personalized AI suggestions!",
      };

      // Cache mock response too
      setCachedResponse(cacheKey, mockResponse);

      return res.json(mockResponse);
    }

    const prompt = `You are MOLLY Go, a travel expert who helps people find joy through travel. 
    Based on the user's mood: "${mood}", interests: "${interests}", budget: "${budget}", and duration: "${duration}",
    suggest 3-5 amazing destinations where they can find joy, festivals, celebrations, or experiences that match their feelings.
    
    For each destination, provide:
    1. Destination name and country
    2. Why it matches their mood/interests (2-3 sentences)
    3. Best time to visit
    4. 2-3 specific experiences or events to look for
    5. Estimated cost range
    
    Make it warm, inspiring, and focused on emotional experiences rather than just tourist attractions.
    Format as a JSON array of objects with: destination, country, description, bestTime, experiences, costRange`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, a warm and inspiring travel expert who helps people discover joy through travel experiences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);
    const response = { recommendations };

    // Cache the response
    setCachedResponse(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error("Error getting travel recommendations:", error);

    // Handle quota limit gracefully
    if (error.status === 429 || error.code === "insufficient_quota") {
      console.log("⚠️ OpenAI quota exceeded - using mock data");
      const mockRecommendations = [
        {
          destination: "Lisbon, Portugal",
          reason: "Perfect blend of culture, food, and vibrant nightlife",
          moodMatch: "excited, adventurous, curious",
          bestTime: "Spring (March-May)",
          budget: "Mid-range ($100-150/day)",
          highlights: [
            "Fado music venues",
            "Pasteis de Nata",
            "Tram 28",
            "Belem Tower",
          ],
        },
        {
          destination: "Kyoto, Japan",
          reason:
            "Traditional temples meet modern innovation in a peaceful setting",
          moodMatch: "peaceful, reflective, curious",
          bestTime: "Spring (Cherry Blossoms) or Fall (Autumn Colors)",
          budget: "Mid-range ($120-180/day)",
          highlights: [
            "Arashiyama Bamboo Grove",
            "Fushimi Inari Shrine",
            "Kaiseki dining",
            "Traditional ryokans",
          ],
        },
      ];
      return res.json({
        recommendations: mockRecommendations,
        message:
          "🎭 Demo mode: OpenAI quota exceeded - showing sample recommendations. Add billing to your OpenAI account for real AI-powered suggestions!",
      });
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, creating personalized travel experiences focused on joy and authentic local culture.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });

    const itinerary = JSON.parse(completion.choices[0].message.content);
    res.json({ itinerary });
  } catch (error) {
    console.error("Error generating itinerary:", error);

    // Handle quota limit gracefully
    if (error.status === 429 || error.code === "insufficient_quota") {
      console.log("⚠️ OpenAI quota exceeded - using mock itinerary");
      const mockItinerary = {
        title: "Perfect Weekend Getaway",
        days: [
          {
            day: 1,
            title: "Arrival & Exploration",
            activities: [
              {
                time: "10:00 AM",
                activity: "Check into your hotel and freshen up",
                location: "Hotel",
              },
              {
                time: "12:00 PM",
                activity: "Lunch at local market",
                location: "Central Market",
              },
              {
                time: "2:00 PM",
                activity: "Walking tour of historic district",
                location: "Old Town",
              },
              {
                time: "6:00 PM",
                activity: "Sunset dinner with local cuisine",
                location: "Rooftop Restaurant",
              },
              {
                time: "8:00 PM",
                activity: "Evening entertainment - live music",
                location: "Cultural Center",
              },
            ],
          },
          {
            day: 2,
            title: "Adventure & Culture",
            activities: [
              {
                time: "9:00 AM",
                activity: "Morning hike to scenic viewpoint",
                location: "Mountain Trail",
              },
              {
                time: "12:00 PM",
                activity: "Picnic lunch with local specialties",
                location: "Scenic Overlook",
              },
              {
                time: "2:00 PM",
                activity: "Visit to local museum or gallery",
                location: "Art Museum",
              },
              {
                time: "4:00 PM",
                activity: "Coffee break at charming cafe",
                location: "Historic Cafe",
              },
              {
                time: "7:00 PM",
                activity: "Farewell dinner at recommended restaurant",
                location: "Fine Dining",
              },
            ],
          },
        ],
        tips: [
          "Book restaurants in advance for dinner reservations",
          "Wear comfortable walking shoes for city exploration",
          "Check local weather and pack accordingly",
          "Learn a few basic phrases in the local language",
        ],
      };
      return res.json({
        itinerary: mockItinerary,
        message:
          "🎭 Demo mode: OpenAI quota exceeded - showing sample itinerary. Add billing to your OpenAI account for personalized AI itineraries!",
      });
    }

    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

// Get local events and festivals for a destination
app.post("/api/local-events", async (req, res) => {
  try {
    if (!openai) {
      // Return mock events when OpenAI is not available
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, specializing in finding authentic local events and cultural experiences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const events = JSON.parse(completion.choices[0].message.content);
    res.json({ events });
  } catch (error) {
    console.error("Error getting local events:", error);

    // Handle quota limit gracefully
    if (error.status === 429 || error.code === "insufficient_quota") {
      console.log("⚠️ OpenAI quota exceeded - using mock events");
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
        {
          name: "Local Food & Wine Tasting",
          date: "Every Sunday 1-5 PM",
          description:
            "Sample authentic local cuisine paired with regional wines. Meet local producers and chefs.",
          location: "Historic Wine Cellar",
          cost: "$45 per person",
          specialNote: "Includes 5-course tasting menu with wine pairings",
        },
      ];
      return res.json({
        events: mockEvents,
        message:
          "🎭 Demo mode: OpenAI quota exceeded - showing sample events. Add billing to your OpenAI account for real-time event discovery!",
      });
    }

    res.status(500).json({ error: "Failed to get local events" });
  }
});

// NEW ENDPOINTS FOR ENHANCED MOLLY GO FUNCTIONALITY

// Search for experiences by mood/feeling
app.post("/api/experience-search", async (req, res) => {
  try {
    const { mood, location, budget, duration } = req.body;

    if (!openai) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, expert in matching experiences to emotional states and travel desires.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const experiences = JSON.parse(completion.choices[0].message.content);
    res.json({ experiences });
  } catch (error) {
    console.error("Error searching experiences:", error);
    res.status(500).json({ error: "Failed to search experiences" });
  }
});

// Get destination insights and tips
app.get("/api/destination-insights/:destination", async (req, res) => {
  try {
    const { destination } = req.params;

    if (!openai) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, providing authentic travel insights and local knowledge.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const insights = JSON.parse(completion.choices[0].message.content);
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

    if (!openai) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, matching accommodations to traveler moods and experiences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const accommodations = JSON.parse(completion.choices[0].message.content);
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

  // Normalize and detect country automatically
  const normalizedCity = city.toLowerCase().replace(/\s+/g, "");
  const countryCode = countryHints[normalizedCity] || "GB";

  console.log(`🏨 Searching hotels in ${city} (${countryCode})`);

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("⏰ Timeout waiting for LiteAPI")),
        10000
      )
    );

    // Check if city is empty and return friendly response
    if (!city || city.trim() === "") {
      return res.json({
        reply: "Please tell me which city you want to explore 😊",
      });
    }

    // Determine authentication mode based on environment
    const isProduction = process.env.NODE_ENV === "production";
    let headers, apiUrl;

    if (isProduction && process.env.PROD_API_KEY) {
      // Production mode with Standard Authentication
      apiUrl = `https://api.liteapi.travel/v3.0/data/hotels?city=${encodeURIComponent(
        city
      )}&countryCode=${countryCode}&limit=3`;
      headers = {
        "X-API-Key": process.env.PROD_API_KEY,
        "Content-Type": "application/json",
      };

      console.log("🌍 LiteAPI Mode: PRODUCTION");
      console.log("🔑 Using X-API-Key header for authentication");
    } else {
      // Development mode with sandbox key
      apiUrl = `https://api.liteapi.travel/v3.0/data/hotels?city=${encodeURIComponent(
        city
      )}&countryCode=${countryCode}&limit=3`;
      headers = {
        "X-API-Key": process.env.SAND_API_KEY,
        "Content-Type": "application/json",
      };

      console.log("🌍 LiteAPI Mode: SANDBOX");
      console.log("🔑 Using X-API-Key header for authentication");
    }

    console.log("🌍 Searching hotels for city:", city);
    console.log("🌐 Fetching:", apiUrl);
    console.log("🔑 Using headers:", Object.keys(headers));

    const liteapiCall = fetch(apiUrl, {
      headers: headers,
    }).then((r) => r.json());

    const data = await Promise.race([liteapiCall, timeout]);

    if (data?.data?.length) {
      // Get country flag emoji
      const countryFlags = {
        IE: "🇮🇪",
        PT: "🇵🇹",
        GB: "🇬🇧",
        FR: "🇫🇷",
        ES: "🇪🇸",
        DE: "🇩🇪",
        IT: "🇮🇹",
        CZ: "🇨🇿",
        HR: "🇭🇷",
        AE: "🇦🇪",
        AT: "🇦🇹",
        NL: "🇳🇱",
        US: "🇺🇸",
      };
      const countryFlag = countryFlags[countryCode] || "🏨";

      // Format hotel list with clean bullet points
      const hotelList = data.data
        .slice(0, 3)
        .map((h) => {
          // Clean hotel name - remove duplicates and city names in parentheses
          let hotelName = h.name || "Hotel";
          // Remove city name from hotel name if it appears at the end
          hotelName = hotelName.replace(
            new RegExp(`\\s+${city}\\s*$`, "i"),
            ""
          );
          return `• ${hotelName}`;
        })
        .join("\n");

      console.log("✅ LiteAPI returned", data.data.length, "results for", city);

      return res.json({
        reply: `🏨 Here are some hotels in ${city} ${countryFlag}\n\n${hotelList}`,
      });
    }

    // Log warning for empty LiteAPI response
    console.warn("⚠️ LiteAPI returned no data for:", city);

    // Fallback if LiteAPI returns empty
    return res.json({
      reply: `⚠️ I couldn't find hotels in "${city}". Maybe try another city! Here are some demo picks:\n\n• Joy Inn\n• Dream Hotel\n• Cloud Resort`,
    });
  } catch (err) {
    console.error("❌ LiteAPI fetch failed:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      city: city,
      mode: isProduction ? "PRODUCTION" : "DEVELOPMENT",
      hasProdKey: !!process.env.PROD_API_KEY,
      hasSandboxKey: !!process.env.SAND_API_KEY,
    });
    return res.json({
      reply:
        "😅 Something went wrong connecting to the travel API, but I can still suggest some options:\n\n• Joy Inn\n• Dream Hotel\n• Cloud Resort 🏨✨",
    });
  }
});

// Get weather and seasonal recommendations
app.get("/api/weather-insights/:destination", async (req, res) => {
  try {
    const { destination } = req.params;
    const { month } = req.query;

    if (!openai) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are MOLLY Go, providing weather-aware travel planning and seasonal insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const weatherInsights = JSON.parse(completion.choices[0].message.content);
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
const fetch = require("node-fetch");

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
      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 500
      ) {
        // Return mock data for authentication or server errors
        const mockHotels = {
          data: [
            { name: "Joy Inn", address: "Downtown" },
            { name: "Dream Hotel", address: "Central Park" },
            { name: "Sunrise Suites", address: "Broadway" },
          ],
        };
        console.log("🏨 Returning mock hotel data due to LiteAPI error");
        return res.json(mockHotels);
      }
      throw new Error(`LiteAPI responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ LiteAPI response received:", data);
    console.log("🏨 LiteAPI hotel data:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error);

    // Return mock hotel data instead of error
    const mockHotels = {
      data: [
        { name: "Joy Inn", address: "Downtown" },
        { name: "Dream Hotel", address: "Central Park" },
        { name: "Sunrise Suites", address: "Broadway" },
      ],
    };

    console.log("🏨 Returning mock hotel data for:", city);
    res.json(mockHotels);
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(
    `📊 OpenAI Integration: ${openai ? "✅ Active" : "❌ Disabled (Mock Mode)"}`
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
