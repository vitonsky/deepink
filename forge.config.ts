import type { MakerDebConfig } from '@electron-forge/maker-deb';
import type { MakerDMGConfig } from '@electron-forge/maker-dmg';
import type { MakerRpmConfig } from '@electron-forge/maker-rpm';
import type { MakerWixConfig } from '@electron-forge/maker-wix';
import type { MakerZIPConfig } from '@electron-forge/maker-zip';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { MakerAppImageConfig } from '@reforged/maker-appimage';

import projectInfo from './package.json';

// We do not need any files except those in dist
const allowedPathPrefixes = ['/dist', '/package.json'];

// Docs: https://electron.github.io/packager/main/interfaces/Options.html
export default {
	packagerConfig: {
		asar: true,
		name: 'Deepink',
		executableName: 'deepink',
		icon: 'assets/icons/app',
		ignore(path) {
			const isAllowed =
				path.trim().length === 0 ||
				allowedPathPrefixes.some((allowedPath) => path.startsWith(allowedPath));
			return !isAllowed;
		},
		extraResource: ['./dist/assets'],
	},
	makers: [
		{
			name: '@electron-forge/maker-zip',
			config: {} satisfies MakerZIPConfig,
		},
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
			name: '@electron-forge/maker-dmg',
			platforms: ['darwin'],
			config: {
				format: 'ULFO',
				overwrite: true,
			} satisfies MakerDMGConfig,
		},
		{
			name: '@reforged/maker-appimage',
			platforms: ['linux'],
			config: {
				options: {
					categories: [
						'Office',
						'Education',
						'Dictionary',
						'Documentation',
						'Presentation',
						'ProjectManagement',
						'Science',
						'TextEditor',
						'TextTools',
						'Utility',
					],
					icon: 'assets/icons/app.png',
				},
			} satisfies MakerAppImageConfig,
		},
		{
			name: '@electron-forge/maker-deb',
			platforms: ['linux'],
			config: {
				options: {
					productName: 'Deepink',
					genericName: 'Privacy focused notes',
					icon: 'assets/icons/app.png',
					maintainer: projectInfo.author,
					categories: ['Office', 'Science', 'Education'],
				},
			} satisfies MakerDebConfig,
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {
				options: {
					productName: 'Deepink',
					productDescription: 'Privacy focused notes',
					genericName: 'genericName: Privacy focused notes',
					icon: 'assets/icons/app.png',
					license: 'MIT',
					homepage: 'http://example.com',
					categories: ['Office', 'Science', 'Education'],
				},
			} satisfies MakerRpmConfig,
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
	],
} satisfies ForgeConfig;
