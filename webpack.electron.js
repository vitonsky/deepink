const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const sharp = require('sharp');
const ico = require('sharp-ico');

const commonConfig = require('./webpack.common');
const { statSync, existsSync, readdirSync } = require('fs');
const path = require('path');

const getPreloadScripts = () => {
	const preloadScripts = [];
	for (const file of readdirSync('./src/windows', { withFileTypes: true })) {
		if (!file.isDirectory()) continue;

		const preloadPath = path.resolve(
			path.join(file.parentPath, file.name, 'preload.ts'),
		);
		if (!existsSync(preloadPath) || !statSync(preloadPath).isFile()) continue;

		preloadScripts.push(preloadPath);
	}

	return preloadScripts.map((filename) => ({
		path: filename,
		name: path.basename(path.dirname(filename)),
	}));
};

module.exports = merge(commonConfig, {
	target: 'electron-main',
	entry: {
		main: './src/main.ts',
		...Object.fromEntries(
			getPreloadScripts().map(({ name, path }) => [`window-${name}-preload`, path]),
		),
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'assets', to: 'assets' },
				{
					// PNG icon for general purposes
					from: 'assets/icons/app.svg',
					to: 'assets/icons/app.png',
					transform(content) {
						return sharp(content).resize(512, 512).toBuffer();
					},
				},
				{
					// Icon for Windows app
					from: 'assets/icons/app.svg',
					to: 'assets/icons/app.ico',
					async transform(content) {
						const source = await sharp(content).resize(256, 256).toBuffer();
						return ico.encode([source]);
					},
				},
			],
		}),
	],
	module: {
		rules: [
			{
				test: /\.node$/,
				loader: 'node-loader',
			},
		],
	},
});
