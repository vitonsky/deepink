The twofish code is taken from https://sources.debian.org/src/twofish/0.3-5

## Build

Requirements
- NodeJS
- Docker (for WASM compilation)
- Unix environment

We build the WASM module in Docker, so if you use macOS, start a Docker service.

Run `npm run build` to build WASM module and TypeScript files.
