# Contributing to Setups Works Office

## Run it from source

Needs Node.js 20+ and pnpm 10 or 11 (`corepack enable` gets you pnpm).

```bash
git clone https://github.com/Setups-Works/setups-works-office && cd setups-works-office
pnpm install
pnpm dev                                   # the UI with fake data, no agents
HQ_REPO=~/developer/hq-test pnpm dev:hq    # the real HQ server + UI, with hot reload
```

`pnpm dev` is a demo with fake data: nothing runs and nothing leaves the browser. To test a change for real, use `pnpm dev:hq` or `pnpm hq` against a throwaway repo.

| Command | Does |
| --- | --- |
| `pnpm dev` | Demo UI with fake data at http://localhost:5173 |
| `pnpm dev:hq` | Real HQ server + UI with hot reload (`HQ_REPO=<path>`) |
| `pnpm hq` | Builds the UI, then runs HQ like a release (`--repo <path> --port 7420`) |
| `pnpm build` | Type-checks, builds the UI to `dist/` and the server to `dist-server/` |
| `pnpm typecheck` | Type-check only |
| `npm pack` | Builds the npm tarball, to test it before publishing |

Start HQ with `HQ_DEBUG=1` to log why a queued message is waiting.

## Where things are

```
src/
  data/      Types, the OfficeDataSource interface, fake (data/mock) and real (data/ws) data
  store/     Zustand stores; the only code that talks to the data source
  office/    The PixiJS pixel office: layout, sprites, agents, belt
  ui/        Top bar, team panel, activity, drawers, settings, setup checklist, welcome
server/      Local HQ server: setup checks, workspaces, sessions (tmux, or HQ-run on Windows), sbx, hooks, Team MCP, GitHub
bin/         The setups-works-office command
docs/        User guides, and the product spec (swoffic-context.md)
context/     Implementation plans
```

## Docker Sandboxes versions

HQ calls the `sbx` CLI and reads its output. sbx 0.48 changed several outputs (for example `sbx ls --json` and `sbx mcp ls --json` now return a bare array), so read sbx output in a way that accepts both the old and the new format. HQ is tested on sbx 0.47 and 0.50.

## Releasing

1. Bump `version` in `package.json` and merge to `main`.
2. From a clean, up-to-date `main`, run `npm publish`. It builds first.

Only members of the `setupsworks` npm org can publish. The README on npm updates only when a new version is published.

## Desktop apps

- **macOS: native Swift app** in `macos/` (SwiftUI + AppKit). It runs a bundled Node and the same HQ server the CLI uses, and shows the office in a `WKWebView`, with native pieces around it: a sidebar with the live team, board and activity (read from HQ's WebSocket), toolbar, menu bar item, notifications when an agent needs you, a Dock badge, Settings, drag a folder onto the window to open it, and Sparkle auto-update.
- **Windows: Electron app** in `desktop/` (same server, in a window, with electron-updater).

```bash
pnpm mac:build      # builds "Setups Works Office.app" (+ zip and dmg) into macos/dist, for this Mac's architecture
ARCH=x64 pnpm mac:build   # the Intel build
pnpm desktop:dev    # Windows/Electron shell, for development
pnpm desktop:dist   # Electron installer for this OS in release/
```

**Releasing:** on GitHub open **Actions → Release → Run workflow** and type the version (for example `0.9.2`). The workflow bumps `package.json`, commits, tags, creates one GitHub Release, builds the Mac apps (Apple silicon and Intel) and the Windows installer into it, and publishes the npm package. The repo's releases must be publicly readable for updates to work.

**Mac auto-update (Sparkle):** the app checks `appcast-arm64.xml` / `appcast-x64.xml` on the latest release and verifies updates with an EdDSA key, so it works **without an Apple certificate**. The public key is in `macos/sparkle-public-key.txt`. The workflow needs the private key as a repo secret `SPARKLE_ED_PRIVATE_KEY` (without it the Mac app still builds, but doesn't auto-update). The key pair lives in the login keychain of the Mac that created it; to set the secret from that Mac:

```bash
macos/.cache/sparkle-tools/bin/generate_keys -x /tmp/sparkle.key && gh secret set SPARKLE_ED_PRIVATE_KEY < /tmp/sparkle.key && rm /tmp/sparkle.key
```

(`macos/.cache/sparkle-tools` comes from Sparkle's release tarball; `build-app.sh` doesn't need it.)

**Signing:** without certificates the Mac app is ad-hoc signed (first launch: right-click → Open) and the Windows app shows a SmartScreen warning. To sign the Mac app, add repo secrets `MAC_CSC_LINK` (Developer ID Application certificate, base64 `.p12`), `MAC_CSC_KEY_PASSWORD`, `MAC_SIGN_IDENTITY` (for example `Developer ID Application: Your Name (TEAMID)`), and for notarization `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`. For Windows: `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`.

**npm:** the same workflow publishes `@setupsworks/office` (with provenance), skipping it if that version is already published. It needs a repo secret `NPM_TOKEN`: on npmjs.com create a **granular access token** with read and write access to the package that can publish without a one-time password, then `gh secret set NPM_TOKEN`.
