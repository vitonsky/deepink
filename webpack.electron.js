const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
	target: 'electron-main',
	entry: {
		main: './src/main.ts',
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
