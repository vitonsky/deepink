#!/usr/bin/env bash
# build.sh
set -euo pipefail

CLANG=${CLANG:-clang}

echo "→ Compiler: $($CLANG --version | head -1)"
echo "→ Building twofish.wasm ..."

$CLANG \
    --target=wasm32-unknown-unknown \
    -fuse-ld=lld \
    -O3 \
    -nostdlib \
    -I. \
    -Wl,--no-entry \
    -Wl,--allow-undefined \
    -Wl,--export=twofish_init \
    -Wl,--export=twofish_get_io_buffer \
    -Wl,--export=twofish_create_session \
    -Wl,--export=twofish_encrypt \
    -Wl,--export=twofish_decrypt \
    -Wl,--export=twofish_destroy_session \
    -Wl,--export=memory \
    -o twofish.wasm \
    twofish.c \
    twofish_wasm.c

echo "✓ Done — $(wc -c < twofish.wasm | tr -d ' ') bytes → twofish.wasm"