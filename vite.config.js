const { defineConfig } = require("vite");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

module.exports = defineConfig({
  server: {
    port: 5173, // Use standard Vite port
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  define: {
    // Make environment variables available to client
    "import.meta.env.VITE_LITEAPI_KEY": JSON.stringify(
      process.env.VITE_LITEAPI_KEY
    ),
    "import.meta.env.VITE_LITEAPI_URL": JSON.stringify(
      process.env.VITE_LITEAPI_URL
    ),
  },
});
