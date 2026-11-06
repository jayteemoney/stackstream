#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_test() {
  cd "$ROOT"
  NODE_ENV=test npm test
}

run_frontend() {
  cd "$ROOT/frontend"
  npx tsc --noEmit
  npm run lint
  npm run build
}

run_openclaw() {
  cd "$ROOT/openclaw-service"
  npx tsc --noEmit
}

case "${1:-all}" in
  all)
    run_test
    run_frontend
    run_openclaw
    cd "$ROOT/frontend"
    ;;
  test) run_test ;;
  frontend) run_frontend ;;
  openclaw) run_openclaw ;;
  *)
    echo "usage: $0 [all|test|frontend|openclaw]" >&2
    exit 1
    ;;
esac
