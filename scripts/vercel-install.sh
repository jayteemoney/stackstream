#!/usr/bin/env bash

set -euo pipefail

node scripts/vercel-promotion-guard.mjs
npm ci --include=dev --prefer-offline --no-audit --no-fund
npm ci --prefix frontend --include=dev --prefer-offline --no-audit --no-fund
npm ci --prefix openclaw-service --include=dev --prefer-offline --no-audit --no-fund
