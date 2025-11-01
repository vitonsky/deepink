const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { mode, isProduction, isFastBuild } = require('./scripts/webpack');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { SwcMinifyWebpackPlugin } = require('swc-minify-webpack-plugin');

const devtool = isProduction ? undefined : 'source-map';

const outputPath = path.join(__dirname, 'dist');

console.log('Webpack run', {
	isProduction,
	isFastBuild,
	devtool,
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
	optimization: {
		// usedExports: true,
		// minimize: true,
		minimizer: [
			// swc-based minifier (faster than terser)
			new SwcMinifyWebpackPlugin(),
		],
	},
	cache: { type: 'filesystem' },
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
			// Replace ts-loader rule (preserves your negative lookbehind to skip .worker)
			{
				test: /(?<!\.worker)\.tsx?$/,
				// compile TS/TSX with SWC (fast)
				loader: 'swc-loader',
				options: {
					jsc: {
						parser: { syntax: 'typescript', tsx: true, decorators: true },
						transform: {
							react: {
								runtime: 'automatic',
								pragma: 'React.createElement',
								pragmaFrag: 'React.Fragment',
							},
						},
						target: 'es2022',
					},
					sourceMaps: true,
				},
				// note: if you previously used allowTsInNodeModules: true, remove the default exclude or
				// explicitly include the packages you need (see note below).
			},

			// Replace babel-loader rule for .js
			{
				test: /\.js$/,
				exclude: /node_modules/, // remove/adjust if you need to compile JS in node_modules
				loader: 'swc-loader',
				options: {
					jsc: {
						parser: { syntax: 'ecmascript', jsx: false },
						target: 'es2022',
					},
					sourceMaps: true,
				},
			},
			{
				test: /\.sql$/,
				type: 'asset/source',
			},
		],
	},

	plugins: [
		// run full TS type check in parallel; async: false -> build waits for typecheck and fails on errors
		new ForkTsCheckerWebpackPlugin({
			async: false,
			typescript: { configFile: path.resolve(__dirname, 'tsconfig.json') },
		}),
	],
};
