import { FuseV1Options, FuseVersion } from '@electron/fuses';
import type { MakerWixConfig } from '@electron-forge/maker-wix';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import type { ForgeConfig } from '@electron-forge/shared-types';
// We do not need any files except those in dist
const allowedPathPrefixes = ['/dist', '/package.json'];

// Docs: https://electron.github.io/packager/main/interfaces/Options.html
export default {
	packagerConfig: {
		asar: true,
		icon: 'dist/assets/icons/app',
		ignore(path) {
			const isAllowed =
				path.trim().length === 0 ||
				allowedPathPrefixes.some((allowedPath) => path.startsWith(allowedPath));
			return !isAllowed;
		},
		extraResource: ['./dist/assets'],
		osxSign: {},
	},
	makers: [
		{
			name: '@electron-forge/maker-wix',
			platforms: ['win32'],
			config: {
				autoRun: true,
				icon: 'dist/assets/icons/app.ico',
				features: {
					autoLaunch: true,
					autoUpdate: false,
				},
				ui: {
					chooseDirectory: true,
				},
			} satisfies MakerWixConfig,
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
			config: {},
		},
		{
			name: '@reforged/maker-appimage',
			platforms: ['linux'],
			config: {
				options: {
					categories: ['Office'],
					icon: 'assets/icons/app.svg',
				},
			},
		},
		// {
		// 	name: '@electron-forge/maker-deb',
		// 	platforms: ['linux'],
		// 	config: {},
		// },
		// {
		// 	name: '@electron-forge/maker-rpm',
		// 	config: {},
		// },
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},

		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
} satisfies ForgeConfig;
