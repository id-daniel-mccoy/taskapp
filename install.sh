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
chmod +x "$ROOT/taskapp" "$ROOT/install.sh"

if [[ "$INSTALL_DESKTOP" -eq 1 && "$(uname -s)" == "Linux" ]]; then
  APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  mkdir -p "$APP_DIR"
  sed -e "s|@EXEC@|$ROOT/taskapp|g" -e "s|@ICON@|$ROOT/resources/icon.png|g" \
    "$ROOT/linux/taskapp.desktop" > "$APP_DIR/taskapp.desktop"
  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
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
