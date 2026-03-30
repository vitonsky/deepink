#!/usr/bin/env bash
# build.sh
set -euo pipefail

CLANG=${CLANG:-clang}

echo "→ Compiler: $($CLANG --version | head -1)"
echo "→ Building twofish.wasm ..."

mkdir -p dist

$CLANG \
  --target=wasm32-unknown-unknown \
  -fuse-ld=lld \
  -O3 \
  -nostdlib \
  -ffreestanding \
  -fno-builtin \
  -I. \
  -Isrc/c \
  -Wl,--no-entry \
  -Wl,--export=twofish_init \
  -Wl,--export=twofish_get_io_buffer \
  -Wl,--export=twofish_create_session \
  -Wl,--export=twofish_encrypt \
  -Wl,--export=twofish_decrypt \
  -Wl,--export=twofish_destroy_session \
  -o dist/twofish.wasm \
  $(find src -name '*.c')

echo "✓ Done — $(wc -c < twofish.wasm | tr -d ' ') bytes → twofish.wasm"