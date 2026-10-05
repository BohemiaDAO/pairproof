import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static build (deploys to Vercel as-is). The Solana libraries expect a global `Buffer`,
// which src/polyfills.ts provides.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { "process.env": {} },
  build: { target: "es2022", chunkSizeWarningLimit: 1500 },
});
