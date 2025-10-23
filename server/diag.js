// ✅ LiteAPI Diagnostics Route - Health check and timing
const fetch = require("node-fetch");

async function diagLiteAPI(req, res) {
  const startTime = Date.now();
  const { city = "berlin" } = req.query;

  try {
    // Get API key from environment
    const apiKey =
      process.env.LITEAPI_KEY ||
      process.env.VITE_LITEAPI_KEY ||
      process.env.PROD_API_KEY;
    const isProduction = apiKey?.startsWith("prod_");
    const isSandbox = apiKey?.startsWith("sand_");

    console.log("🔍 DIAG: Testing LiteAPI connection...");
    console.log("🔑 Key prefix:", apiKey?.slice(0, 8) + "...");
    console.log(
      "🌐 Mode:",
      isProduction ? "Production" : isSandbox ? "Sandbox" : "Unknown"
    );

    if (!apiKey) {
      return res.json({
        ok: false,
        status: 500,
        ms: Date.now() - startTime,
        error: "No LiteAPI key found in environment variables",
        keys: {
          serverKeyPrefix: "none",
          hasViteKey: !!process.env.VITE_LITEAPI_KEY,
        },
      });
    }

    // Test LiteAPI connection
    const testUrl = `https://api.liteapi.travel/v3.0/data/hotels?cityName=${encodeURIComponent(
      city
    )}&countryCode=DE&limit=5`;
    console.log("🌍 Testing URL:", testUrl);

    const response = await fetch(testUrl, {
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    console.log("📡 Response status:", response.status);
    console.log("⏱️ Response time:", responseTime + "ms");

    if (!response.ok) {
      return res.json({
        ok: false,
        status: response.status,
        ms: responseTime,
        error: `LiteAPI returned ${response.status}: ${responseText.substring(
          0,
          200
        )}`,
        city,
        mode: isProduction ? "prod" : "sand",
        keys: {
          serverKeyPrefix: apiKey.slice(0, 8),
          hasViteKey: !!process.env.VITE_LITEAPI_KEY,
        },
      });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      return res.json({
        ok: false,
        status: response.status,
        ms: responseTime,
        error: `Invalid JSON response: ${parseError.message}`,
        city,
        mode: isProduction ? "prod" : "sand",
        keys: {
          serverKeyPrefix: apiKey.slice(0, 8),
          hasViteKey: !!process.env.VITE_LITEAPI_KEY,
        },
      });
    }

    // Extract hotel data
    const hotels = jsonData.data || jsonData.items || jsonData.results || [];
    const firstHotel = hotels[0];

    console.log("🏨 Hotels found:", hotels.length);
    if (firstHotel) {
      console.log("🏨 First hotel:", firstHotel.name);
    }

    res.json({
      ok: true,
      status: response.status,
      ms: responseTime,
      city,
      itemCount: hotels.length,
      first: firstHotel
        ? {
            name: firstHotel.name,
            image:
              firstHotel.thumbnail || firstHotel.main_photo || firstHotel.image,
          }
        : null,
      mode: isProduction ? "prod" : "sand",
      keys: {
        serverKeyPrefix: apiKey.slice(0, 8),
        hasViteKey: !!process.env.VITE_LITEAPI_KEY,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ DIAG Error:", error.message);

    res.json({
      ok: false,
      status: 500,
      ms: responseTime,
      error: error.message,
      city,
      keys: {
        serverKeyPrefix: (
          process.env.LITEAPI_KEY ||
          process.env.VITE_LITEAPI_KEY ||
          ""
        ).slice(0, 8),
        hasViteKey: !!process.env.VITE_LITEAPI_KEY,
      },
    });
  }
}

module.exports = { diagLiteAPI };
