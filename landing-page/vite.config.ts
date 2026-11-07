import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The landing page lives in the same repo. It reuses the app's theme tokens and,
// at /playground/, serves the real app on its demo data so visitors can try everything.
//   pnpm landing:dev   |   pnpm landing:build
export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5180, fs: { allow: [".."] } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), playground: resolve(__dirname, "playground/index.html") } },
  },
});
