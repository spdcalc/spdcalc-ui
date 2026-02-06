# Add wasm32 target for Rust
rustup target add wasm32-unknown-unknown

# Install rsw (Rust WASM CLI)
cargo install rsw

bun add -g wasm-pack

# Install bun dependencies
bun install
