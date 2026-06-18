#!/usr/bin/env bash
# Inject our rebrand into the materialized upstream frontend, then it's ready to
# build with upstream's OWN production Dockerfile (which correctly handles runtime
# env injection, favicon generation, sprite build, etc.).
#
# Order: render brand config -> overlay full-file replacements -> overlay brand
# assets -> run token/metadata patches. Idempotent; safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

UP="frontend/_upstream"
[ -d "$UP" ] || { echo "upstream missing — run scripts/fork-frontend.sh first"; exit 1; }

echo "[prepare] 1/4 render brand config"
bash scripts/render-config.sh >/dev/null

echo "[prepare] 2/4 overlay full-file replacements (Footer, favicon-generator, ...)"
# overlays/ mirrors the upstream tree; copy over the source.
( cd frontend/overlays && find . -type f -print0 | while IFS= read -r -d '' f; do
    mkdir -p "../_upstream/$(dirname "$f")"
    cp "$f" "../_upstream/$f"
    echo "    overlay: ${f#./}"
  done )

echo "[prepare] 3/4 overlay brand assets -> public/assets + static"
mkdir -p "$UP/public/assets" "$UP/public/static"
cp -f frontend/public/assets/* "$UP/public/assets/"
# Network logo/icon are commonly referenced from /static as well.
cp -f frontend/public/assets/logo.svg "$UP/public/static/logo.svg" 2>/dev/null || true
cp -f frontend/public/assets/icon.png "$UP/public/static/icon.png" 2>/dev/null || true

echo "[prepare] 3.5/4 normalize shell-script line endings to LF (Windows safety)"
# Alpine /bin/sh fails on CRLF; ensure every shell script is LF regardless of host
# git config. Covers all *.sh in the tree, not just deploy/.
norm=0
while IFS= read -r -d '' f; do
  if grep -q $'\r' "$f"; then sed -i 's/\r$//' "$f"; norm=$((norm+1)); fi
done < <(find "$UP" -type f -name '*.sh' -not -path '*/node_modules/*' -print0 2>/dev/null)
echo "    normalized $norm shell script(s) to LF"

echo "[prepare] 4/4 apply brand token/metadata patches"
( cd "$UP" && BRAND_NAME="$(. ../../config/brand.env >/dev/null 2>&1; echo "${BRAND_NAME:-Explorer}")" \
    node ../patches/apply-brand-patches.js )

echo "[prepare] done — upstream is rebranded and ready for 'docker compose build frontend'"
