FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        clang          \
        lld            \
        libclang-rt-dev \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Confirm wasm32 target is available
RUN clang --print-targets 2>&1 | grep -q wasm \
    || (echo "ERROR: clang has no WASM target" && exit 1)

ARG UID=1000
ARG GID=1000

RUN groupadd --gid ${GID} builder \
    && useradd  --uid ${UID} --gid ${GID} --no-create-home builder

USER builder

WORKDIR /src

CMD ["bash", "build.sh"]