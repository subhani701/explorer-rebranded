#!/usr/bin/env bash
# Postgres backup for the explorer DB. Writes a compressed custom-format dump
# to backups/ with a timestamp, and prunes dumps older than RETENTION_DAYS.
set -euo pipefail
cd "$(dirname "$0")/.."

RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="backups"
mkdir -p "$OUT_DIR"
OUT_FILE="${OUT_DIR}/blockscout-${STAMP}.dump"

echo "[backup] dumping blockscout database -> ${OUT_FILE}"
docker compose exec -T db \
  pg_dump -U blockscout -d blockscout -F c -Z 9 > "$OUT_FILE"

echo "[backup] verifying dump integrity"
docker compose exec -T db pg_restore --list /dev/stdin < "$OUT_FILE" >/dev/null \
  && echo "[backup] OK ($(du -h "$OUT_FILE" | cut -f1))"

echo "[backup] pruning dumps older than ${RETENTION_DAYS} days"
find "$OUT_DIR" -name 'blockscout-*.dump' -mtime +"$RETENTION_DAYS" -print -delete || true
echo "[backup] done"
