import type { ForgeConfig } from '@electron-forge/shared-types';

// Docs: https://electron.github.io/packager/main/interfaces/Options.html
export default {
	packagerConfig: {
		asar: true,
		extraResource: ['./dist/assets'],
		osxSign: {},
	},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: {
				authors: 'Robert Vitonsky',
			},
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
			config: {},
		},
		{
			name: '@electron-forge/maker-deb',
			platforms: ['linux'],
			config: {},
		},
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
	],
} satisfies ForgeConfig;
