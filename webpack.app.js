const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sharp = require('sharp');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
	target: 'web',
	entry: {
		app: './src/app.tsx',
	},
	plugins: [
		new MiniCssExtractPlugin({}),
		new CopyPlugin({
			patterns: [
				{ from: "src/index.html" },
				{ from: "src/index.css" },
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
		]
	}
});