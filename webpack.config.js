const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sharp = require('sharp');

console.log('Webpack run');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = mode === 'production';

const devtool = isProduction ? undefined : 'inline-source-map';
const isFastBuild = !isProduction && process.env.FAST_BUILD === 'on';

const outputPath = path.join(__dirname, 'dist');

module.exports = {
	mode,
	devtool,
	target: 'electron-main',
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
	entry: {
		main: './src/main.ts',
	},
	output: {
		path: outputPath,
	},
	plugins: [
		new MiniCssExtractPlugin({}),
		new CopyPlugin({
			patterns: [
				{ from: "src/index.html" },
				{ from: "assets", to: 'assets' },
				{
					from: "assets/icons/app.svg",
					to: 'assets/icons/app.png',
					transform(content) {
						return sharp(content).resize(512, 512).toBuffer();
					}
				},
			],
		}),
	],
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
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									[
										'postcss-rem-to-pixel',
										{
											rootValue: 16,
											unitPrecision: 5,
											propList: ['*'],
											selectorBlackList: [],
											replace: true,
											mediaQuery: false,
											minUnitValue: 0,
										},
									],
								],
							},
						},
					},
				],
			},
			{
				test: /\.ttf$/,
				loader: 'file-loader',
				options: {
					publicPath: '/',
				},
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
		],
	},
};