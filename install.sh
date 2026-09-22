#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

INSTALL_DESKTOP=1
if [[ "${1:-}" == "--no-desktop" ]]; then
  INSTALL_DESKTOP=0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Taskapp needs Node.js 18 or newer."
  echo "Debian/Ubuntu:  sudo apt install nodejs npm"
  echo "Or install from https://nodejs.org"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Node.js 18+ is required. Found $(node -v)."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Install it with Node.js, then re-run this script."
  exit 1
fi

echo "Installing Taskapp into $ROOT"
npm install
chmod +x "$ROOT/taskapp" "$ROOT/taskapp-alarm" "$ROOT/install.sh"

electron_ready() {
  [[ -f "$ROOT/node_modules/electron/path.txt" && -x "$ROOT/node_modules/electron/dist/electron" ]]
}

extract_electron_zip() {
  local zip="$1"
  local dest="$ROOT/node_modules/electron/dist"
  mkdir -p "$dest"
  if command -v unzip >/dev/null 2>&1; then
    unzip -o -q "$zip" -d "$dest"
  else
    python3 - "$zip" "$dest" <<'PY'
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    archive.extractall(sys.argv[2])
PY
  fi
  printf 'electron\n' > "$ROOT/node_modules/electron/path.txt"
  chmod +x "$ROOT/node_modules/electron/dist/electron"
}

if ! electron_ready; then
  echo "Downloading the Electron runtime (this can take a minute)…"
  node "$ROOT/node_modules/electron/install.js" || true
fi

if ! electron_ready; then
  CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/electron"
  ZIP="$(find "$CACHE_DIR" -name 'electron-*-linux-*.zip' -type f 2>/dev/null | tail -1 || true)"
  if [[ -n "${ZIP}" && -f "${ZIP}" ]]; then
    echo "Finishing the Electron extract…"
    extract_electron_zip "$ZIP"
  fi
fi

if ! electron_ready; then
  echo "Electron's runtime failed to install."
  echo "Check your network, then re-run: $ROOT/install.sh"
  echo "If GitHub releases are blocked, set ELECTRON_MIRROR and try again."
  exit 1
fi

if [[ "$INSTALL_DESKTOP" -eq 1 && "$(uname -s)" == "Linux" ]]; then
  APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  ICON_BASE="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor"
  mkdir -p "$APP_DIR" \
    "$ICON_BASE/48x48/apps" \
    "$ICON_BASE/64x64/apps" \
    "$ICON_BASE/128x128/apps" \
    "$ICON_BASE/256x256/apps" \
    "$ICON_BASE/512x512/apps" \
    "$ICON_BASE/scalable/apps"
  cp "$ROOT/resources/icons/icon-48.png" "$ICON_BASE/48x48/apps/taskapp.png"
  cp "$ROOT/resources/icons/icon-64.png" "$ICON_BASE/64x64/apps/taskapp.png"
  cp "$ROOT/resources/icons/icon-128.png" "$ICON_BASE/128x128/apps/taskapp.png"
  cp "$ROOT/resources/icons/icon-256.png" "$ICON_BASE/256x256/apps/taskapp.png"
  cp "$ROOT/resources/icons/icon-512.png" "$ICON_BASE/512x512/apps/taskapp.png"
  cp "$ROOT/resources/icon.svg" "$ICON_BASE/scalable/apps/taskapp.svg"
  sed -e "s|@EXEC@|$ROOT/taskapp|g" \
    -e "s|@ROOT@|$ROOT|g" \
    "$ROOT/linux/taskapp.desktop" > "$APP_DIR/taskapp.desktop"
  chmod +x "$ROOT/taskapp" "$ROOT/taskapp-alarm"
  rm -f "$ICON_BASE/icon-theme.cache"
  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
  fi
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$ICON_BASE" >/dev/null 2>&1 || true
  fi
  if command -v xdg-desktop-menu >/dev/null 2>&1; then
    xdg-desktop-menu forceupdate >/dev/null 2>&1 || true
  fi
  echo "Added Taskapp to your application menu."
fi

echo
echo "Ready. Start it with:"
echo "  ./taskapp"
echo "  ./taskapp notes.md data.json report.pdf"
echo
echo "Or from anywhere:"
echo "  $ROOT/taskapp"
