const path = require('path');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = mode === 'production';

const devtool = isProduction ? undefined : 'inline-source-map';
const isFastBuild = !isProduction && process.env.FAST_BUILD === 'on';

const outputPath = path.join(__dirname, 'dist');

console.log('Webpack run', {
	devtool,
	isFastBuild,
	outputPath
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
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
	},
	output: {
		path: outputPath,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
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
		],
	},
	externals: [
		{
			'sqlite3': 'commonjs2 sqlite3',
		}
	],
};