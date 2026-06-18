#!/usr/bin/env bash
# Mirror brand.env values into the build args (.env) and frontend.env so the
# single source of truth (config/brand.env) drives everything. Idempotent.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f config/brand.env ] || { echo "config/brand.env missing — run 'make init'"; exit 1; }
# shellcheck disable=SC1091
set -a; source config/brand.env; set +a

# Push favicon master URL into .env build args
if [ -f .env ]; then
  sed -i.bak "s#^BRAND_FAVICON_MASTER_URL=.*#BRAND_FAVICON_MASTER_URL=${BRAND_FAVICON_MASTER_URL}#" .env && rm -f .env.bak
fi

# Emit the generated brand file consumed by the frontend build-time patch engine.
mkdir -p frontend/patches
cat > frontend/patches/brand.generated.json <<JSON
{
  "name": "${BRAND_NAME}",
  "shortName": "${BRAND_SHORT_NAME}",
  "networkName": "${BRAND_NETWORK_NAME}",
  "description": "${BRAND_META_DESCRIPTION}",
  "metaTitle": "${BRAND_META_TITLE}",
  "copyright": "${BRAND_FOOTER_COPYRIGHT}",
  "colorPrimary": "${BRAND_COLOR_PRIMARY}",
  "colorSecondary": "${BRAND_COLOR_SECONDARY}",
  "colorAccent": "${BRAND_COLOR_ACCENT}",
  "homepage": "${BRAND_HOMEPAGE_URL}"
}
JSON

echo "Brand config rendered:"
echo "  name      = ${BRAND_NAME}"
echo "  network   = ${BRAND_NETWORK_NAME}"
echo "  primary   = ${BRAND_COLOR_PRIMARY}"
echo "  footer    = ${BRAND_FOOTER_LINKS_URL}"
echo "  -> frontend/patches/brand.generated.json written"
echo "Frontend env interpolates brand.env at compose time (env_file ordering)."
