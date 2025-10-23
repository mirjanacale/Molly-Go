// ✅ Environment Variables Loader for Client
// This script loads environment variables from the server

async function loadEnvironmentVariables() {
  try {
    // Try to fetch environment variables from server
    const response = await fetch("/api/env");
    if (response.ok) {
      const env = await response.json();
      window.VITE_LITEAPI_KEY = env.VITE_LITEAPI_KEY;
      window.VITE_LITEAPI_URL = env.VITE_LITEAPI_URL;
      console.log("✅ Environment variables loaded from server");
      console.log("Key:", window.VITE_LITEAPI_KEY?.slice(0, 8) + "...");
      console.log("URL:", window.VITE_LITEAPI_URL);
    } else {
      console.warn("⚠️ Could not load environment variables from server");
    }
  } catch (error) {
    console.warn("⚠️ Environment loader error:", error.message);
  }
}

// Load environment variables when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadEnvironmentVariables);
} else {
  loadEnvironmentVariables();
}
