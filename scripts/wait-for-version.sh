#!/usr/bin/env bash
# Poll <api_url>/api/health until .version == <sha>; exit 0 on match, 1 on timeout.
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "usage: $0 <api_url> <sha> [timeout_s=600]" >&2
  exit 2
fi

api_url="${1%/}"
sha="$2"
timeout_s="${3:-600}"
interval="${POLL_INTERVAL:-10}"

deadline=$(( $(date +%s) + timeout_s ))
while :; do
  body="$(curl -fsS --max-time 10 "$api_url/api/health" 2>/dev/null || true)"
  version="$(printf '%s' "$body" | jq -r '.version // empty' 2>/dev/null || true)"
  if [ "$version" = "$sha" ]; then
    echo "OK: $api_url is running version $sha"
    exit 0
  fi
  echo "waiting for version $sha (current: ${version:-unreachable})..."
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "TIMEOUT after ${timeout_s}s waiting for version $sha" >&2
    exit 1
  fi
  sleep "$interval"
done
