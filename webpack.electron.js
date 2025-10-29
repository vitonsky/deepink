const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');

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
			patterns: [{ from: 'assets', to: 'assets' }],
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
