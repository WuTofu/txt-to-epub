import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // GitHub Pages serves this project from /txt-to-epub/, everywhere else
  // (dev, preview, Cloudflare Workers) serves from the domain root.
  base: process.env.GITHUB_ACTIONS ? "/txt-to-epub/" : "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
});
