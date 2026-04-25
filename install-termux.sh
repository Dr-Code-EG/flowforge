#!/data/data/com.termux/files/usr/bin/env bash
# FlowForge — Termux installer
# Installs Node.js, pnpm, builds the app, and starts it on http://localhost:3000.
# Re-run this script to update an existing checkout.
set -euo pipefail

GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; NC=$'\033[0m'
say() { printf "${GREEN}==>${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!! ${NC}%s\n" "$*"; }
err() { printf "${RED}xx ${NC}%s\n" "$*" >&2; }

# 1. Sanity check we're inside Termux
if [ ! -d "/data/data/com.termux" ] && [ -z "${FORCE_TERMUX:-}" ]; then
  warn "This doesn't look like Termux. Set FORCE_TERMUX=1 to bypass."
  exit 1
fi

# 2. Install required Termux packages
say "Updating apt and installing build dependencies..."
pkg update -y
pkg install -y nodejs git python make clang openssl libsqlite

# 3. Enable corepack/pnpm
say "Activating pnpm via corepack..."
corepack enable || warn "corepack not found, falling back to npm install -g pnpm"
if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@9.15.9
fi

# 4. Clone or update repo
TARGET_DIR="${FLOWFORGE_DIR:-$HOME/flowforge}"
if [ ! -d "$TARGET_DIR/.git" ]; then
  say "Cloning FlowForge into $TARGET_DIR..."
  git clone "${FLOWFORGE_REPO:-https://github.com/Dr-Code-EG/flowforge.git}" "$TARGET_DIR"
else
  say "Updating existing checkout in $TARGET_DIR..."
  git -C "$TARGET_DIR" pull --ff-only || warn "git pull failed (keeping current state)"
fi
cd "$TARGET_DIR"

# 5. Install workspace deps
say "Installing JS dependencies (this can take a minute on the phone)..."
pnpm install

# 6. Generate .env if missing
if [ ! -f .env ]; then
  say "Creating .env with safe defaults..."
  cp .env.example .env
  # Replace JWT_SECRET and ENCRYPTION_KEY with random values
  RAND_JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  RAND_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$RAND_JWT|" .env
  sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$RAND_KEY|" .env
fi

# 7. Build everything (shared, backend, frontend)
say "Building shared package..."
pnpm --filter @flowforge/shared build
say "Building frontend (this is the slowest step on Termux)..."
pnpm --filter @flowforge/frontend build
say "Building backend..."
pnpm --filter @flowforge/backend build

# 8. Start backend (foreground)
say "Starting FlowForge on http://localhost:3000"
say "Open this URL in your phone's browser to see the dashboard."
say "Press Ctrl+C to stop."
cd packages/backend
exec node dist/main.js
