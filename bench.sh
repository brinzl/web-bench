#!/usr/bin/env bash
set -euo pipefail

FW="${1:-}"
if [ -z "$FW" ]; then
  echo "Usage: ./bench.sh <framework>"
  echo "  bun-raw | hono | elysia | itty"
  exit 1
fi

BASE="http://localhost:3000"
DURATION="10s"
CONCURRENCY=100

# Check server is running
if ! curl -sf -o /dev/null "${BASE}/plaintext" 2>/dev/null; then
  echo "Server not running. Start it first: bun run ${FW}"
  exit 1
fi

run() {
  local name="$1" path="$2" method="${3:-GET}" body="${4:-}"
  echo ""
  echo "=== ${FW} :: ${name} ==="

  # warmup
  if [ "$method" = "POST" ]; then
    curl -sf -o /dev/null -X POST -H "Content-Type: application/json" -d "$body" "${BASE}${path}"
  else
    curl -sf -o /dev/null "${BASE}${path}"
  fi

  # bench
  if [ "$method" = "POST" ]; then
    hey -z "$DURATION" -c "$CONCURRENCY" -m POST -T "application/json" -d "$body" "${BASE}${path}"
  else
    hey -z "$DURATION" -c "$CONCURRENCY" "${BASE}${path}"
  fi
}

run "plaintext"  "/plaintext"
run "json"       "/json"
run "params"     "/user/42"
run "body-parse" "/echo" "POST" '{"name":"bench","value":42}'
run "routes-100" "/route-99"

echo ""
echo "Done."
