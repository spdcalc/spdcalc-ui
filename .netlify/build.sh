#!/usr/bin/env bash
set -e

echo "==> Installing wasm-pack..."
cargo install wasm-pack

echo "==> Installing rsw..."
cargo install rsw

echo "==> Installing dependencies..."
bun install

