// ✅ LiteAPI Diagnostics Panel - Frontend health check
// TODO: Remove DiagnosticsPanel and extra logs before production.

class DiagnosticsPanel {
  constructor() {
    this.panel = null;
    this.results = {};
    this.createPanel();
    this.runInitialTests();
  }

  createPanel() {
    // Create panel container
    this.panel = document.createElement("div");
    this.panel.id = "liteapi-diagnostics";
    this.panel.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: #1a1a1a;
        color: #fff;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #4CAF50;">🔍 LiteAPI Diagnostics</h3>
          <button id="close-diagnostics" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
        </div>
        
        <div id="env-info" style="margin-bottom: 10px;">
          <div><strong>Key:</strong> <span id="key-preview">Loading...</span></div>
          <div><strong>Base URL:</strong> <span id="base-url">Loading...</span></div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <button id="test-server-proxy" style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Server Proxy Test</button>
          <button id="test-browser-direct" style="background: #FF9800; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Browser Direct Test</button>
        </div>
        
        <div id="test-results" style="background: #2a2a2a; padding: 10px; border-radius: 4px; min-height: 100px;">
          <div>Click buttons above to run tests...</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.setupEventListeners();
    this.loadEnvironmentInfo();
  }

  setupEventListeners() {
    // Close button
    document
      .getElementById("close-diagnostics")
      .addEventListener("click", () => {
        this.panel.remove();
      });

    // Test buttons
    document
      .getElementById("test-server-proxy")
      .addEventListener("click", () => {
        this.testServerProxy();
      });

    document
      .getElementById("test-browser-direct")
      .addEventListener("click", () => {
        this.testBrowserDirect();
      });
  }

  loadEnvironmentInfo() {
    // Get environment variables - try multiple sources
    const keyPreview =
      (
        window.VITE_LITEAPI_KEY ||
        import.meta?.env?.VITE_LITEAPI_KEY ||
        ""
      ).slice(0, 8) + "...";
    const baseUrl =
      window.VITE_LITEAPI_URL ||
      import.meta?.env?.VITE_LITEAPI_URL ||
      "Not found";

    console.log("Loaded KEY:", import.meta?.env?.VITE_LITEAPI_KEY);
    console.log("Loaded URL:", import.meta?.env?.VITE_LITEAPI_URL);

    document.getElementById("key-preview").textContent = keyPreview;
    document.getElementById("base-url").textContent = baseUrl;
  }

  async testServerProxy() {
    const startTime = Date.now();
    this.updateResults("server-proxy", "Testing server proxy...", "info");

    try {
      console.time("SERVER_PROXY_TEST");
      console.log("🔍 Testing server proxy...");

      const response = await fetch("/api/diag/liteapi?city=berlin");
      const data = await response.json();
      const duration = Date.now() - startTime;

      console.log("📡 Server proxy response:", data);
      console.timeEnd("SERVER_PROXY_TEST");

      if (data.ok) {
        this.updateResults(
          "server-proxy",
          `✅ Server proxy working!<br>
           Status: ${data.status}<br>
           Time: ${data.ms}ms<br>
           Hotels: ${data.itemCount}<br>
           Mode: ${data.mode}<br>
           First: ${data.first?.name || "None"}`,
          "success"
        );
      } else {
        this.updateResults(
          "server-proxy",
          `❌ Server proxy failed!<br>
           Status: ${data.status}<br>
           Error: ${data.error}`,
          "error"
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ Server proxy error:", error);
      this.updateResults(
        "server-proxy",
        `❌ Server proxy error!<br>
         Time: ${duration}ms<br>
         Error: ${error.message}`,
        "error"
      );
    }
  }

  async testBrowserDirect() {
    const startTime = Date.now();
    this.updateResults("browser-direct", "Testing browser direct...", "info");

    try {
      console.time("BROWSER_DIRECT_TEST");
      console.log("🔍 Testing browser direct...");

      const apiKey =
        window.VITE_LITEAPI_KEY || import.meta?.env?.VITE_LITEAPI_KEY;
      const baseUrl =
        window.VITE_LITEAPI_URL || import.meta?.env?.VITE_LITEAPI_URL;

      if (!apiKey || !baseUrl) {
        throw new Error("Missing VITE_LITEAPI_KEY or VITE_LITEAPI_URL");
      }

      const testUrl = `${baseUrl}/data/hotels?cityName=berlin&countryCode=DE&limit=5`;
      console.log("🌍 Direct URL:", testUrl);

      const response = await fetch(testUrl, {
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();
      const duration = Date.now() - startTime;

      console.log("📡 Direct response status:", response.status);
      console.log("📡 Direct response time:", duration + "ms");
      console.timeEnd("BROWSER_DIRECT_TEST");

      if (response.ok) {
        let jsonData;
        try {
          jsonData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON: ${parseError.message}`);
        }

        const hotels =
          jsonData.data || jsonData.items || jsonData.results || [];
        const firstHotel = hotels[0];

        this.updateResults(
          "browser-direct",
          `✅ Browser direct working!<br>
           Status: ${response.status}<br>
           Time: ${duration}ms<br>
           Hotels: ${hotels.length}<br>
           First: ${firstHotel?.name || "None"}`,
          "success"
        );
      } else {
        this.updateResults(
          "browser-direct",
          `❌ Browser direct failed!<br>
           Status: ${response.status}<br>
           Response: ${responseText.substring(0, 100)}...`,
          "error"
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ Browser direct error:", error);

      let errorType = "Network Error";
      if (error.message.includes("CORS")) {
        errorType = "CORS Error";
      } else if (error.message.includes("Failed to fetch")) {
        errorType = "Network/CORS Error";
      }

      this.updateResults(
        "browser-direct",
        `❌ Browser direct ${errorType}!<br>
         Time: ${duration}ms<br>
         Error: ${error.message}`,
        "error"
      );
    }
  }

  updateResults(testType, message, type) {
    const resultsDiv = document.getElementById("test-results");
    const timestamp = new Date().toLocaleTimeString();

    const colorMap = {
      success: "#4CAF50",
      error: "#f44336",
      info: "#2196F3",
    };

    const iconMap = {
      success: "✅",
      error: "❌",
      info: "🔄",
    };

    const newResult = `
      <div style="margin-bottom: 8px; padding: 8px; background: #333; border-radius: 4px; border-left: 3px solid ${
        colorMap[type]
      };">
        <div style="font-weight: bold; color: ${colorMap[type]};">
          ${iconMap[type]} ${testType.toUpperCase()} (${timestamp})
        </div>
        <div style="margin-top: 4px;">${message}</div>
      </div>
    `;

    resultsDiv.innerHTML = newResult + resultsDiv.innerHTML;
  }

  runInitialTests() {
    // Auto-run server proxy test on load
    setTimeout(() => {
      this.testServerProxy();
    }, 1000);
  }
}

// Auto-initialize in development
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new DiagnosticsPanel();
    });
  } else {
    new DiagnosticsPanel();
  }
}

// Export for manual initialization
window.DiagnosticsPanel = DiagnosticsPanel;
