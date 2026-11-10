#!/usr/bin/env bash
# Adds the handbook to the application menu and the desktop. Run again after moving the folder.
set -e
DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
chmod +x "$DIR/start-linux.sh"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$APPS"
ENTRY="$APPS/clinical-microbiology.desktop"
cat > "$ENTRY" <<DESK
[Desktop Entry]
Type=Application
Name=میکروب‌شناسی بالینی تشخیصی
Name[en]=Clinical Microbiology
Comment=درس‌نامهٔ تعاملی باکتری‌شناسی تشخیصی
Exec="$DIR/start-linux.sh"
Icon=$DIR/assets/icon/icon-512.png
Terminal=false
Categories=Education;MedicalSoftware;
StartupWMClass=ClinicalMicrobiology
DESK
chmod +x "$ENTRY"
DESKTOP="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
if [ -d "$DESKTOP" ]; then
  cp "$ENTRY" "$DESKTOP/clinical-microbiology.desktop"
  chmod +x "$DESKTOP/clinical-microbiology.desktop"
  gio set "$DESKTOP/clinical-microbiology.desktop" metadata::trusted true 2>/dev/null || true
fi
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APPS" 2>/dev/null || true
echo "Installed: application menu and desktop icon ($DESKTOP)."
