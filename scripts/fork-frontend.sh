#!/usr/bin/env bash
# Materialize the Blockscout frontend fork into frontend/_upstream at a pinned tag.
# Re-runnable: wipes and re-clones _upstream, preserving our tracked overlay files
# (Dockerfile, REBRAND.md, public/assets/, patches/).
set -euo pipefail
cd "$(dirname "$0")/../frontend"

FRONTEND_TAG="${FRONTEND_TAG:-v2.8.0}"   # pin to a known-good upstream release
REPO="https://github.com/blockscout/frontend.git"

echo "[fork] materializing upstream frontend @ ${FRONTEND_TAG}"
rm -rf _upstream
# Preserve LF line endings (critical on Windows hosts: shell scripts run by the
# Alpine /bin/sh in the build break with CRLF).
git -c core.autocrlf=false -c core.eol=lf clone --depth 1 --branch "${FRONTEND_TAG}" "${REPO}" _upstream
rm -rf _upstream/.git

echo "[fork] upstream ready at frontend/_upstream"
echo "[fork] brand patches applied during docker build (patches/apply-brand-patches.js)"
echo "[fork] next: 'make build' (or 'make rebuild-frontend' after brand changes)"
