import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/search-rates": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/search-hotels": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/prebook": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/book": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
