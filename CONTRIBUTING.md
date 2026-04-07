# Contributing

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Runtime & build tooling |
| Docker | any recent | Building the Twofish WASM module |

## Setup

```bash
git clone <repo-url>
cd <repo>
npm install
```

## Building

Build everything (WASM + TypeScript):

Build dependencies:

```bash
cd packages/twofish
npm run build
```

The WASM build runs inside Docker automatically — no need to install `clang` or `lld` locally. Docker must be running.

Then build the app:

```bash
npm run build
```

## Linting & Tests

```bash
npm run lint
npm test
```

## CI

GitHub Actions runs on every push to `master` and on pull requests:

- **actionlint** — validates GitHub Actions workflow files
- **tests** — builds, lints, and runs the test suite
- **CodeQL** — static security analysis

PRs from forks skip the CodeQL step.