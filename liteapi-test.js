// ✅ LiteAPI Connection Test - Verifies production key authentication
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

async function testLiteAPI() {
  console.log("🔍 Testing LiteAPI Connection...");

  // Check environment variables
  const apiKey =
    process.env.VITE_LITEAPI_KEY ||
    process.env.LITEAPI_KEY ||
    process.env.PROD_API_KEY;
  const apiUrl =
    process.env.VITE_LITEAPI_URL || "https://api.liteapi.travel/v3.0";

  console.log("🔑 API Key found:", !!apiKey ? "✅ Yes" : "❌ No");
  if (apiKey) {
    console.log("🔑 Key prefix:", apiKey.slice(0, 8) + "...");
    console.log(
      "🔑 Key type:",
      apiKey.startsWith("prod_")
        ? "Production"
        : apiKey.startsWith("sand_")
        ? "Sandbox"
        : "Unknown"
    );
  }
  console.log("🌐 API URL:", apiUrl);

  if (!apiKey) {
    console.log("❌ LiteAPI key or mode is invalid.");
    console.log("💡 Please add VITE_LITEAPI_KEY=prod_... to your .env file");
    return;
  }

  try {
    const testUrl = `${apiUrl}/data/hotels?cityName=berlin&countryCode=DE&limit=5`;
    console.log("🌍 Testing URL:", testUrl);

    const response = await fetch(testUrl, {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    console.log("📡 Response Status:", response.status);
    console.log("📡 Response OK:", response.ok);

    if (response.status === 401) {
      console.log("❌ LiteAPI key or mode is invalid.");
      console.log(
        "💡 Check if your key is valid and Sandbox Mode is OFF in LiteAPI dashboard"
      );
      return;
    }

    if (response.status === 403) {
      console.log("❌ LiteAPI key or mode is invalid.");
      console.log("💡 Your key may be restricted or in sandbox mode");
      return;
    }

    if (!response.ok) {
      console.log("❌ LiteAPI key or mode is invalid.");
      console.log("💡 Unexpected error:", response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log("📦 Response keys:", Object.keys(data));

    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log("🏨 Hotels found:", data.data.length);
      console.log("🏨 First hotel:", data.data[0].name);
      console.log("✅ LiteAPI connection successful.");
    } else if (
      data.items &&
      Array.isArray(data.items) &&
      data.items.length > 0
    ) {
      console.log("🏨 Hotels found:", data.items.length);
      console.log("🏨 First hotel:", data.items[0].name);
      console.log("✅ LiteAPI connection successful.");
    } else {
      console.log("⚠️ No hotels found in response");
      console.log("📦 Full response:", JSON.stringify(data, null, 2));
      console.log("❌ LiteAPI key or mode is invalid.");
    }
  } catch (error) {
    console.log("❌ LiteAPI key or mode is invalid.");
    console.log("💡 Error:", error.message);
  }
}

testLiteAPI();
