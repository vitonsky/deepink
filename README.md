This is notes app project, focused on security and user experience.

If you can't find a good notes solution that respect your privacy and not ugly - **it is messages from the stars for you**, stay tunned.

# Build

To build in dev mode run `npm run dev`, to run production code run `npm run build`.

This commands will build source files to directory `dist`.

# Packaging

To package app, you need first build it and then package it for your platform via `npm run make` command.

There are specific prerequisites per each platform. All instructions listed below.

<!-- TODO: add step to push artifacts from build machine to an S3 -->
Once requirements are meet
- Clone repo `git clone https://github.com/vitonsky/deepink.git`
- Checkout `cd deepink`
- Build and pack. Example for Windows: `make build artifacts`

## Windows

### Virtual machine setup

To build for Windows on Linux/macOS you can run a virtual machine via [QEMU](https://www.qemu.org/).

To setup environment
- [Download QEMU](https://www.qemu.org/download)
	- On Linux you can run `sudo apt-get install -y virt-manager` to install [virtual machine manager](https://virt-manager.org/), a GUI to manage QEMU
	- On macOS you can run `brew install virt-manager`
- [Download](https://www.microsoft.com/en-us/software-download/windows11) and install Windows
- Optionally: Once Windows is installed, you may configure [Guest Tools](https://pve.proxmox.com/wiki/Windows_VirtIO_Drivers) to enable shared clipboard and directories
	- Install a [guest tools](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/archive-virtio/virtio-win-0.1.285-1/virtio-win-guest-tools.exe) to enable shared clipboard
	- [Download WinFSP](https://winfsp.dev/rel/) and install. Once installed, go to "Services" find a "VirtIO-FS Service", start it and change "Startup type" in properties to an "Auto". See a [video guide](https://www.youtube.com/watch?v=UCy25VFMJCE&t=195s) "Share Files between KVM Host and Windows Virtual Machine" on YouTube
- Optionally: Update `winget`, a windows packages manager
	```powershell
	Invoke-WebRequest -Uri https://aka.ms/getwinget -OutFile $HOME/Downloads/Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle
	Add-AppxPackage -Path $HOME/Downloads/Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle

	# Optionally - update env in curren shell
	refreshenv
	```

Once you will done with these steps, it is good idea to backup disk image to not do all that steps again.


### Environment setup

To build on Windows, a dev environment is needed.

Update [security policy](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7.5) to allow run dev tools:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope LocalMachine
```

[Install chocolatey](https://chocolatey.org/install), a packages manager. If you have `winget` installed, just run
```powershell
winget install -e --id Chocolatey.Chocolatey
```

Once chocolatey is ready, install all necessary packages (run in PowerShell as Administrator)

```powershell
choco install -y git make nodejs-lts python
```

To package app for windows, a [WiX Toolset v3](https://docs.firegiant.com/wix/wix3/) must be installed:

```sh
choco install -y wixtoolset  --version=3.14.0

# Extend PATH to add WiX Toolset and make it visible for makers

# via PowerShell
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files (x86)\WiX Toolset v3.14\bin", "Machine")
# via cmd
setx /M PATH "%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin"
```

## macOS

Before start build, an [Xcode](https://developer.apple.com/xcode/) must be installed and user agreement must be accepted.

In case you've update your OS recently and have problems with compiling anything, it may be a problem on Xcode side. The solution is to remove and install Xcode again.

## Linux

Next packages must be installed
- `deb`
- `rpm`

# Trouble shooting

## Linux

### The SUID sandbox helper binary was found, but is not configured correctly

Error occurs on Ubuntu when run `AppImage` and looks like that

```
[31456:1101/232759.563532:FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:166] The SUID sandbox helper binary was found, but is not configured correctly. Rather than run without sandboxing I'm aborting now. You need to make sure that /tmp/.mount_DeepinGiNBDl/usr/lib/deepink/chrome-sandbox is owned by root and has mode 4755.
Trace/breakpoint trap (core dumped)
```

The issue is with the AppArmor configuration in Ubuntu 24.04, not the AppImage. The change in the configuration is explained in the release notes of Ubuntu 24.04 (security reasons). For example Fedora Linux have no such problem.

To fix this error you have few options.

**Run with `--no-sandbox`**

You can just run app with no sandbox like that

```
./Deepink-0.0.1-x64.AppImage --no-sandbox
```

**Disable restriction**

To disable restriction for a current session run

```sh
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```

this changes will be reverted back after reboot.

To persist this change, you can run

```sh
# create a local sysctl file with the setting
echo "kernel.apparmor_restrict_unprivileged_userns = 0" | sudo tee /etc/sysctl.d/local.conf

# apply now (reload all sysctl configs)
sudo sysctl --system
```

**Add AppArmor profile**

Configure profile and write at `/etc/apparmor.d/home.app.deepink`

```
abi <abi/4.0>
include <tunables/global>

profile deepink /home/your_username/apps/deepink.AppImage flags=(unconfined) {
  userns,
  include if exists <local/deepink>
}
```