#!/usr/bin/env bash
# Builds the native macOS app: "Setups Works Office.app", plus a .zip (used by auto-update) and a .dmg.
#
#   ARCH=arm64|x64  ./macos/build-app.sh          (default: this Mac's architecture)
#
# Environment (all optional):
#   SKIP_JS_BUILD=1            reuse dist/ and dist-server/ instead of running the JS build
#   MAC_SIGN_IDENTITY="Developer ID Application: Name (TEAMID)"   sign with it (otherwise ad-hoc)
#   APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID        notarize when signing with an identity
#   SPARKLE_PUBLIC_KEY         EdDSA public key for auto-update (default: the one in macos/sparkle-public-key.txt)
#   FEED_BASE                  where the appcast lives (default: the GitHub "latest" release)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"
cd "$ROOT"

case "${ARCH:-$(uname -m)}" in
  arm64|aarch64) ARCH=arm64; SWIFT_ARCH=arm64 ;;
  x64|x86_64)    ARCH=x64;   SWIFT_ARCH=x86_64 ;;
  *) echo "Unknown ARCH"; exit 1 ;;
esac

VERSION="$(node -p "require('./package.json').version")"
APP_NAME="Setups Works Office"
OUT="$HERE/dist"
APP="$OUT/$APP_NAME.app"
CACHE="$HERE/.cache"
FEED_BASE="${FEED_BASE:-https://github.com/Setups-Works/setups-works-office/releases/latest/download}"
PUBKEY="${SPARKLE_PUBLIC_KEY:-$(cat "$HERE/sparkle-public-key.txt" 2>/dev/null || true)}"

echo "▸ Building $APP_NAME $VERSION for $ARCH"
rm -rf "$APP" "$OUT"/*.zip "$OUT"/*.dmg
mkdir -p "$OUT" "$CACHE"

# 1. The server and web UI (same ones the CLI and Windows app use)
if [ -z "${SKIP_JS_BUILD:-}" ]; then
  echo "▸ Building the web UI and server"
  (pnpm build 2>/dev/null || npm run build)
fi
[ -f dist-server/main.mjs ] && [ -f dist/index.html ] || { echo "Missing dist/ or dist-server/. Run the JS build first."; exit 1; }

# 2. The Swift app
echo "▸ Compiling the Swift app"
swift build -c release --arch "$SWIFT_ARCH" --package-path "$HERE" >/dev/null
BIN="$(swift build -c release --arch "$SWIFT_ARCH" --package-path "$HERE" --show-bin-path)/SetupsWorksOffice"
[ -f "$BIN" ] || { echo "Swift build produced no executable at $BIN"; exit 1; }

# 3. Bundle layout
MACOS="$APP/Contents/MacOS"; RES="$APP/Contents/Resources"; FW="$APP/Contents/Frameworks"
mkdir -p "$MACOS" "$RES/server" "$FW"
cp "$BIN" "$MACOS/SetupsWorksOffice"

# Sparkle (auto-update) framework
SPARKLE_FW="$(find "$HERE/.build" -type d -name Sparkle.framework -path "*macos-arm64_x86_64*" 2>/dev/null | head -1)"
[ -n "$SPARKLE_FW" ] || { echo "Sparkle.framework not found. Did swift build resolve packages?"; exit 1; }
ditto "$SPARKLE_FW" "$FW/Sparkle.framework"
install_name_tool -add_rpath "@executable_path/../Frameworks" "$MACOS/SetupsWorksOffice" 2>/dev/null || true

# 4. Icon
ICONSET="$CACHE/AppIcon.iconset"
rm -rf "$ICONSET"; mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$ROOT/build/icon.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$ROOT/build/icon.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$RES/AppIcon.icns"

# 5. Node runtime for this architecture (official build, checksum verified)
NODE_VER="${NODE_VERSION:-22.23.4}"
NODE_TAR="node-v$NODE_VER-darwin-$ARCH.tar.gz"
if [ ! -f "$CACHE/$NODE_TAR" ]; then
  echo "▸ Downloading Node $NODE_VER ($ARCH)"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VER/$NODE_TAR" -o "$CACHE/$NODE_TAR"
fi
EXPECT="$(curl -fsSL "https://nodejs.org/dist/v$NODE_VER/SHASUMS256.txt" | grep " $NODE_TAR\$" | awk '{print $1}')"
ACTUAL="$(shasum -a 256 "$CACHE/$NODE_TAR" | awk '{print $1}')"
[ "$EXPECT" = "$ACTUAL" ] || { echo "Node checksum mismatch"; rm -f "$CACHE/$NODE_TAR"; exit 1; }
tar -xzf "$CACHE/$NODE_TAR" -C "$CACHE" "node-v$NODE_VER-darwin-$ARCH/bin/node"
cp "$CACHE/node-v$NODE_VER-darwin-$ARCH/bin/node" "$RES/node"
chmod +x "$RES/node"

# 6. Server runtime files: dist/, dist-server/ and production dependencies for this architecture
cp -R dist dist-server "$RES/server/"
cp package.json "$RES/server/package.json"
DEPS="$CACHE/deps-$ARCH"
rm -rf "$DEPS"; mkdir -p "$DEPS"
node -e '
  const p = require("./package.json");
  require("fs").writeFileSync(process.argv[1] + "/package.json", JSON.stringify({ name: "swo-server-deps", private: true, version: "0.0.0", dependencies: p.dependencies }, null, 2));
' "$DEPS"
(cd "$DEPS" && npm install --omit=dev --no-audit --no-fund --os=darwin --cpu="$ARCH" --loglevel=error)
cp -R "$DEPS/node_modules" "$RES/server/node_modules"
rm -rf "$RES/server/node_modules/.package-lock.json"
# node-pty's helper must be executable
find "$RES/server/node_modules" -name spawn-helper -exec chmod 755 {} \; 2>/dev/null || true

# 7. Info.plist
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>com.setupsworks.office</string>
  <key>CFBundleExecutable</key><string>SetupsWorksOffice</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.developer-tools</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSSupportsAutomaticTermination</key><false/>
  <key>NSHumanReadableCopyright</key><string>Copyright © 2026 Setups Works</string>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
  <key>SUFeedURL</key><string>$FEED_BASE/appcast-$ARCH.xml</string>
  <key>SUPublicEDKey</key><string>$PUBKEY</string>
  <key>SUEnableAutomaticChecks</key><true/>
  <key>SUScheduledCheckInterval</key><integer>14400</integer>
</dict></plist>
PLIST

# 8. Sign: inside-out. A Developer ID identity if given, otherwise ad-hoc.
IDENTITY="${MAC_SIGN_IDENTITY:--}"
ENTITLEMENTS="$HERE/app.entitlements"
[ "$IDENTITY" != "-" ] && HARDENED=1 && TS="--timestamp" || TS="--timestamp=none"
sign_one() { codesign --force --sign "$IDENTITY" $TS ${HARDENED:+--options runtime} ${2:+--entitlements "$2"} "$1"; }
echo "▸ Signing ($([ "$IDENTITY" = "-" ] && echo ad-hoc || echo "$IDENTITY"))"
find "$RES/server/node_modules" \( -name "*.node" -o -name "spawn-helper" -o -name "*.dylib" \) -type f -print0 | while IFS= read -r -d '' f; do sign_one "$f"; done
sign_one "$RES/node" "$ENTITLEMENTS"
find "$FW/Sparkle.framework" -type d \( -name "*.xpc" -o -name "*.app" \) -print0 | while IFS= read -r -d '' f; do sign_one "$f"; done
find "$FW/Sparkle.framework" -type f -name Autoupdate -print0 | while IFS= read -r -d '' f; do sign_one "$f"; done
sign_one "$FW/Sparkle.framework"
sign_one "$APP" "$ENTITLEMENTS"
codesign --verify --deep --strict "$APP" && echo "  signature ok"

# 9. Notarize (only with a Developer ID identity and Apple credentials)
if [ "$IDENTITY" != "-" ] && [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_APP_SPECIFIC_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  echo "▸ Notarizing"
  ditto -c -k --keepParent "$APP" "$CACHE/notarize.zip"
  xcrun notarytool submit "$CACHE/notarize.zip" --apple-id "$APPLE_ID" --password "$APPLE_APP_SPECIFIC_PASSWORD" --team-id "$APPLE_TEAM_ID" --wait
  xcrun stapler staple "$APP"
fi

# 10. Packages
NAME="Setups-Works-Office-$VERSION-mac-$ARCH"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$OUT/$NAME.zip"
STAGE="$CACHE/dmg-$ARCH"; rm -rf "$STAGE"; mkdir -p "$STAGE"
ditto "$APP" "$STAGE/$APP_NAME.app"
ln -s /Applications "$STAGE/Applications"
hdiutil create -volname "$APP_NAME $VERSION" -srcfolder "$STAGE" -ov -format UDZO "$OUT/$NAME.dmg" >/dev/null
echo "✓ $OUT/$NAME.zip"
echo "✓ $OUT/$NAME.dmg"
du -sh "$APP"
