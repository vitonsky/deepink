/* eslint-disable spellcheck/spell-checker */
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
		// enable tree-shaking
		usedExports: true,
		minimize: isProduction,
		minimizer: [new SwcMinifyWebpackPlugin()],

		// Extract runtime into separate chunk for better caching
		runtimeChunk: isProduction ? 'single' : false,

		// Split vendor chunks to enable better caching
		splitChunks: {
			chunks: (chunk) => {
				// Don't split preload scripts - bundle them completely
				if (chunk.name && chunk.name.endsWith('-preload')) {
					return false;
				}

				// Apply normal splitting for other chunks
				return 'all';
			},

			cacheGroups: {
				// Vendor libraries (stable, rarely change)
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					priority: 10,
					reuseExistingChunk: true,
					enforce: true,
				},
				// Shared code between windows
				common: {
					minChunks: 2, // Extracted if used in 2+ chunks
					priority: 5,
					reuseExistingChunk: true,
					name: 'common',
				},
			},
		},

		// Deterministic module IDs for better caching
		moduleIds: isProduction ? 'deterministic' : 'named',
	},
	// TODO: depends on all webpack configs files
	// cache: {
	// 	type: 'filesystem',
	// 	// Invalidate cache on config changes
	// 	buildDependencies: {
	// 		config: [__filename],
	// 	},
	// },
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

		// Better chunk naming for caching
		// filename: isProduction ? '[name].[contenthash].js' : '[name].js',
		chunkFilename: isProduction ? '[name].[contenthash].js' : '[name].js',
		filename: (pathData) => {
			if (pathData.chunk.name === 'main') {
				return 'main.js';
			}

			// Preload scripts: no hash, just exact name
			if (pathData.chunk.name.endsWith('-preload')) {
				return '[name].js';
			}

			// Other chunks: keep hashed
			return '[name].[contenthash].js';
		},
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
			// Allow async in dev for faster builds
			async: !isProduction,
			typescript: { configFile: path.resolve(__dirname, 'tsconfig.json') },
		}),
	],
};
