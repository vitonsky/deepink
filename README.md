This is notes app project, focused on security and user experience.

If you can't find a good notes solution that respect your privacy and not ugly - **it is messages from the stars for you**, stay tunned.

# Build

To build in dev mode run `npm run dev`, to run production code run `npm run build`.

This commands will build source files to directory `dist`.

## Packaging

To package app, you need first build it and then package it for your platform via `npm run make` command.

There are specific prerequisites per each platform to build

### Windows

To package app for windows, an [WiX Toolset v3](https://docs.firegiant.com/wix/wix3/) must be installed.

You may do it via choco:
- `choco install -y wixtoolset  --version=3.14.0`
- `setx PATH "C:\Program Files (x86)\WiX Toolset v3.14\bin;%PATH%"`

### Linux

Next packages must be installed
- `deb`
- `rpm`

# Trouble shooting

## Linux

Error when run `AppImage`. The problem occurs on latest Ubuntu.

Run `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`

