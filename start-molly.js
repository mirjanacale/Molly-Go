// ✅ MOLLY Go - Simple Startup Script
// This script starts the backend server and provides instructions for frontend

const { exec, spawn } = require("child_process");

console.log("🚀 Starting MOLLY Go...");

// Kill any existing processes on port 3000
console.log("🔍 Checking for existing processes on port 3000...");
exec("netstat -ano | findstr :3000", (error, stdout) => {
  if (stdout && stdout.includes(":3000")) {
    console.log("⚠️ Port 3000 is in use, killing existing processes...");

    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.includes(":3000") && line.includes("LISTENING")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") {
          exec(`taskkill /F /PID ${pid}`, (killError) => {
            if (!killError) {
              console.log("✅ Port 3000 freed");
            }
          });
        }
      }
    }
  }

  // Wait a moment then start the server
  setTimeout(() => {
    console.log("🔧 Starting backend server...");

    const server = spawn("npm", ["run", "start-server"], {
      stdio: "inherit",
      shell: true,
    });

    server.on("error", (err) => {
      console.error("❌ Server error:", err);
    });

    // Give server time to start
    setTimeout(() => {
      console.log("\n🎉 MOLLY Go Backend is running!");
      console.log("📊 Backend: http://localhost:3000");
      console.log("🔍 API endpoints available:");
      console.log("   - http://localhost:3000/api/env");
      console.log("   - http://localhost:3000/api/diag/liteapi?city=berlin");
      console.log("   - http://localhost:3000/api/hotels?city=berlin");
      console.log("\n🌐 To start the frontend, open a new terminal and run:");
      console.log("   npm run dev");
      console.log("\n📱 Then open http://localhost:5173 in your browser");
    }, 3000);
  }, 2000);
});
