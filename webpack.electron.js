const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const sharp = require('sharp');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
	target: 'electron-main',
	entry: {
		main: './src/main.ts',
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "assets", to: 'assets' },
				{
					from: "assets/icons/app.svg",
					to: 'assets/icons/app.png',
					transform(content) {
						return sharp(content).resize(512, 512).toBuffer();
					}
				},
				{ from: "sqliteExtensions", to: 'sqliteExtensions' },
			],
		}),
	]
});