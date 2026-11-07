import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The landing page lives in the same repo and reuses the app's theme tokens
// (../src/theme/tokens.ts) and dependencies. Run from the repo root:
//   pnpm landing:dev   |   pnpm landing:build
export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5180, fs: { allow: [".."] } },
  build: { outDir: "dist", emptyOutDir: true },
});
