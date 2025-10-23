// ✅ MOLLY Go - Full Local Run Setup
// This script automates starting both backend and frontend servers

import { exec, spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

console.log("🚀 Starting MOLLY Go full local setup...");

// Function to kill port 3000 if busy
function killPort3000() {
  return new Promise((resolve) => {
    console.log("🔍 Checking if port 3000 is in use...");

    // Try to kill port 3000 using netstat and taskkill (Windows)
    exec("netstat -ano | findstr :3000", (error, stdout) => {
      if (stdout && stdout.includes(":3000")) {
        console.log("⚠️ Port 3000 is in use, attempting to free it...");

        // Extract PID and kill the process
        const lines = stdout.split("\n");
        for (const line of lines) {
          if (line.includes(":3000") && line.includes("LISTENING")) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== "0") {
              exec(`taskkill /F /PID ${pid}`, (killError) => {
                if (!killError) {
                  console.log("✅ Port 3000 freed successfully");
                } else {
                  console.log(
                    "⚠️ Could not free port 3000, continuing anyway..."
                  );
                }
                resolve();
              });
              return;
            }
          }
        }
        resolve();
      } else {
        console.log("✅ Port 3000 is available");
        resolve();
      }
    });
  });
}

// Function to start backend server
function startBackend() {
  return new Promise((resolve) => {
    console.log("🔧 Starting backend server...");

    const backend = spawn("npm", ["run", "start-server"], {
      stdio: "inherit",
      shell: true,
    });

    backend.on("error", (err) => {
      console.error("❌ Backend error:", err);
    });

    // Wait a bit for backend to start
    setTimeout(() => {
      console.log("✅ Backend server started on port 3000");
      resolve();
    }, 3000);
  });
}

// Function to start frontend server
function startFrontend() {
  console.log("🎨 Starting Vite frontend server...");

  const frontend = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  frontend.on("error", (err) => {
    console.error("❌ Frontend error:", err);
  });

  console.log("✅ Frontend server starting on port 5173");
  console.log("🌐 Open http://localhost:5173 in your browser");
}

// Main execution
async function main() {
  try {
    await killPort3000();
    await startBackend();
    startFrontend();

    console.log("\n🎉 MOLLY Go is now running!");
    console.log("📊 Backend: http://localhost:3000");
    console.log("🎨 Frontend: http://localhost:5173");
    console.log("🔍 Diagnostics panel available in browser");
  } catch (error) {
    console.error("❌ Error starting MOLLY Go:", error);
    process.exit(1);
  }
}

main();
