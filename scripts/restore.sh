#!/usr/bin/env bash
# Restore the explorer DB from a pg_dump custom-format file.
# Usage: RESTORE_FILE=backups/blockscout-YYYYmmdd-HHMMSS.dump make restore
set -euo pipefail
cd "$(dirname "$0")/.."

: "${RESTORE_FILE:?Set RESTORE_FILE=path/to/dump}"
[ -f "$RESTORE_FILE" ] || { echo "file not found: $RESTORE_FILE"; exit 1; }

echo "[restore] WARNING: this overwrites the current blockscout database."
echo "[restore] target file: $RESTORE_FILE"
read -r -p "Type 'yes' to continue: " confirm
[ "$confirm" = "yes" ] || { echo "aborted"; exit 1; }

echo "[restore] stopping backend to release connections"
docker compose stop backend stats || true

echo "[restore] recreating database"
docker compose exec -T db psql -U blockscout -d postgres -c "DROP DATABASE IF EXISTS blockscout;"
docker compose exec -T db psql -U blockscout -d postgres -c "CREATE DATABASE blockscout OWNER blockscout;"

echo "[restore] loading dump"
docker compose exec -T db pg_restore -U blockscout -d blockscout --no-owner < "$RESTORE_FILE"

echo "[restore] restarting services"
docker compose start backend stats
echo "[restore] done"
