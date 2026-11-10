#!/usr/bin/env bash
# Opens the handbook in its own app window (Chrome / Chromium / Edge / Brave), or the default browser.
DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
URL="file://$DIR/index.html"
PROFILE="${XDG_CONFIG_HOME:-$HOME/.config}/clinical-microbiology-app"
for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge microsoft-edge-stable brave-browser; do
  if command -v "$b" >/dev/null 2>&1; then
    exec "$b" --app="$URL" --user-data-dir="$PROFILE" --class=ClinicalMicrobiology \
      --no-first-run --no-default-browser-check --window-size=1400,900 >/dev/null 2>&1
  fi
done
exec xdg-open "$URL"
