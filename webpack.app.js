const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const { readdirSync } = require('fs');

const { isFastBuild } = require('./scripts/webpack');
const commonConfig = require('./webpack.common');

const windows = readdirSync('./src/windows', { withFileTypes: true })
	.filter((file) => file.isDirectory())
	.map((file) => file.name);

module.exports = merge(commonConfig, {
	target: 'electron-renderer',
	entry: {
		...Object.fromEntries(
			windows.map((name) => [
				`window-${name}`,
				`./src/windows/${name}/renderer.tsx`,
			]),
		),
	},
	plugins: [
		...windows.map(
			(name) =>
				new HtmlWebpackPlugin({
					title: 'Deepink',
					filename: `window-${name}.html`,
					chunks: [`window-${name}`],
					template: './src/templates/window.html',
				}),
		),
		new MiniCssExtractPlugin({}),
	],
	module: {
		rules: [
			{
				test: /\.worker\.ts$/i,
				use: [
					{
						loader: 'worker-loader',
						options: {
							worker: 'Worker',
							// eslint-disable-next-line spellcheck/spell-checker
							filename: '[name].[contenthash].js',
						},
					},
					{
						loader: 'ts-loader',
						options: {
							allowTsInNodeModules: true,
							transpileOnly: isFastBuild,
						},
					},
				],
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							modules: {
								mode: (resourcePath) => {
									const isModule = resourcePath.endsWith('.module.css');
									return isModule ? 'local' : 'global';
								},
							},
						},
					},
				],
			},
			{
				test: /\.ttf$/,
				type: 'asset/resource',
			},
			{
				test: /\.svg$/,
				exclude: /node_modules/,
				use: [
					{
						loader: '@svgr/webpack',
						options: {
							svgoConfig: {
								plugins: [
									{
										name: 'preset-default',
										params: {
											overrides: {
												// Option to prevent removing viewBox to svg can be resize
												// Issue created in 2017 https://github.com/gregberge/svgr/issues/18
												removeViewBox: false,
											},
										},
									},
								],
							},
							// This features do not work
							attributes: ['width', 'height'],
						},
					},
				],
			},
		],
	},
});
