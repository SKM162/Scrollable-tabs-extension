#!/usr/bin/env bash
# Build the Chrome Web Store upload: dist/scrollable-tabs-<version>.zip
# Only files the extension needs at runtime are included (no README,
# screenshots, store/marketing material or scripts).
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
out="dist/scrollable-tabs-${version}.zip"

files=(
  manifest.json
  LICENSE
  popup settings feedback modules utils
  assets/default-favicon.svg
  assets/icons/icon16.png assets/icons/icon48.png assets/icons/icon128.png
)

mkdir -p dist
rm -f "$out"
zip -qrX "$out" "${files[@]}" -x '*.DS_Store'
echo "Built $out ($(du -h "$out" | cut -f1))"
unzip -l "$out" | tail -n +4 | head -n -2 | awk '{print "  " $4}'
