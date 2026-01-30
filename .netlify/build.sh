#!/usr/bin/env bash
set -e

# Prefer tag if it exists, fallback to short commit hash
if git describe --tags --exact-match >/dev/null 2>&1; then
  BUILD_VERSION=$(git describe --tags --exact-match)
else
  BUILD_VERSION=$(git rev-parse --short HEAD)
fi

export BUILD_VERSION
echo "Build version: $BUILD_VERSION"
echo "VITE_SPDCALC_BUILD_VERSION=$BUILD_VERSION" > .env.local

echo "==> Installing wasm-pack..."
cargo install wasm-pack

echo "==> Installing rsw..."
cargo install rsw

echo "==> Installing dependencies..."
bun install

