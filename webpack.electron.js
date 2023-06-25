const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
	target: 'electron-main',
	entry: {
		main: './src/main.ts',
	},
});