const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { mode, isProduction, isFastBuild } = require('./scripts/webpack');

const devtool = isProduction ? undefined : 'inline-source-map';

const outputPath = path.join(__dirname, 'dist');

console.log('Webpack run', {
	devtool,
	isFastBuild,
	outputPath,
});

module.exports = {
	mode,
	devtool,
	stats: {
		colors: true,
		reasons: true,
		hash: true,
		version: true,
		timings: true,
		chunks: true,
		chunkModules: true,
		cached: true,
		cachedAssets: true,
	},
	node: {
		__dirname: false,
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
		plugins: [new TsconfigPathsPlugin({})],
	},
	output: {
		path: outputPath,
		publicPath: '',
	},
	module: {
		rules: [
			{
				test: /(?<!\.worker)\.tsx?$/,
				use: {
					loader: 'ts-loader',
					options: {
						allowTsInNodeModules: true,
						transpileOnly: isFastBuild,
					},
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.sql$/,
				type: 'asset/source',
			},
			{
				test: /\.node$/,
				loader: 'node-loader',
			},
		],
	},
};
