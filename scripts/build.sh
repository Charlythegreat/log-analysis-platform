#!/usr/bin/env bash
# ─────────────────────────────────────
# build.sh — Production build
# ─────────────────────────────────────
set -euo pipefail

echo "▸ Installing dependencies…"
npm ci

echo "▸ Building backend…"
npm run build:backend

echo "▸ Building frontend…"
npm run build:frontend

echo "✓ Build complete."
