#!/usr/bin/env bash
# ─────────────────────────────────────
# dev.sh — Start development servers
# ─────────────────────────────────────
set -euo pipefail

echo "▸ Installing dependencies…"
npm install

echo "▸ Starting backend & frontend in dev mode…"
npm run dev
