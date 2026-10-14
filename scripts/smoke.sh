#!/usr/bin/env bash
# Post-deploy smoke test. Exits non-zero on the first failing check.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <api_url> <web_url>" >&2
  exit 2
fi

api_url="${1%/}"
web_url="${2%/}"

echo "check 1: GET $api_url/api/health returns 200"
curl -fsS --max-time 10 -o /dev/null "$api_url/api/health"
echo "  PASS"

echo "check 2: GET $api_url/api/portfolio returns 200 with >= 1 member"
count="$(curl -fsS --max-time 10 "$api_url/api/portfolio" | jq -r '.members | length')"
if [ "$count" -lt 1 ]; then
  echo "  FAIL: members count is $count" >&2
  exit 1
fi
echo "  PASS ($count members)"

echo "check 3: GET $web_url/chat returns 200"
curl -fsS --max-time 10 -o /dev/null "$web_url/chat"
echo "  PASS"

echo "smoke: all checks passed"
