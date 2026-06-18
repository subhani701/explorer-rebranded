#!/usr/bin/env bash
# Aggregate health check across the stack. Exit non-zero if anything is down.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
check() { # name url
  if curl -fsS --max-time 5 "$2" >/dev/null 2>&1; then
    printf "  \033[32mOK\033[0m   %-22s %s\n" "$1" "$2"
  else
    printf "  \033[31mDOWN\033[0m %-22s %s\n" "$1" "$2"; fail=1
  fi
}

echo "Service health:"
check "proxy"     "http://localhost:${PROXY_HTTP_PORT:-80}/health"
check "backend"   "http://localhost:${PROXY_HTTP_PORT:-80}/api/health"
check "frontend"  "http://localhost:${PROXY_HTTP_PORT:-80}/"

echo
echo "Container status:"
docker compose ps --format "  {{.Name}}\t{{.Status}}"

exit $fail
