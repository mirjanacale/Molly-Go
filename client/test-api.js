// ✅ LiteAPI Connection Test — Verifies real data fetch (21 Oct 2025)

async function testLiteAPI() {
  const cityName = "Dubrovnik"; // test with a known city
  console.log("🌍 Testing LiteAPI for city:", cityName);

  try {
    // Test our server endpoint
    console.log("🔄 Testing server endpoint...");
    const serverResponse = await fetch(
      `/api/hotels?city=${encodeURIComponent(cityName)}&countryCode=HR`
    );
    const serverData = await serverResponse.json();

    console.log("✅ Server response:", serverData);

    if (!serverData || Object.keys(serverData).length === 0) {
      console.warn(
        "⚠️ Server returned an empty object — check server configuration."
      );
    } else if (Array.isArray(serverData.items) && serverData.items.length > 0) {
      console.log(
        "🏨 Sample hotels from server:",
        serverData.items.slice(0, 3)
      );

      // Check if data is dynamic (not hardcoded)
      const firstHotel = serverData.items[0];
      if (firstHotel.name.includes(cityName)) {
        console.log("✅ Data is dynamic - hotel names match searched city");
      } else {
        console.warn(
          "⚠️ Data appears to be hardcoded - hotel names don't match city"
        );
      }
    } else {
      console.warn(
        "⚠️ Server response has no recognizable hotel list:",
        serverData
      );
    }

    // Test with different city to verify dynamic behavior
    console.log("🔄 Testing with different city (Berlin)...");
    const berlinResponse = await fetch(
      `/api/hotels?city=${encodeURIComponent("Berlin")}&countryCode=DE`
    );
    const berlinData = await berlinResponse.json();

    if (berlinData.items && berlinData.items.length > 0) {
      const firstBerlinHotel = berlinData.items[0];
      console.log("🏨 Berlin hotel sample:", firstBerlinHotel.name);

      if (firstBerlinHotel.name.includes("Berlin")) {
        console.log(
          "✅ Dynamic data confirmed - Berlin hotels show Berlin in name"
        );
      } else {
        console.warn(
          "⚠️ Berlin hotels don't contain 'Berlin' in name - may be hardcoded"
        );
      }
    }
  } catch (error) {
    console.error("❌ LiteAPI test failed:", error);
  }
}

// Export for use in browser console
window.testLiteAPI = testLiteAPI;

// Auto-run if in browser
if (typeof window !== "undefined") {
  console.log(
    "🔍 LiteAPI Test loaded. Run testLiteAPI() in console or it will auto-run in 2 seconds..."
  );
  setTimeout(testLiteAPI, 2000);
}
