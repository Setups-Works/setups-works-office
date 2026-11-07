// Bundles the Electron main process (desktop/main.ts, with electron-updater inside) into one CJS file.
// Electron itself stays external; the HQ server is built separately by scripts/build-server.mjs.
import { build } from "esbuild";

await build({
  entryPoints: ["desktop/main.ts"],
  outfile: "desktop-dist/main.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
  sourcemap: false,
  logLevel: "warning",
});
console.log("built desktop-dist/main.cjs");
