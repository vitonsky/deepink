import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './shared';
import { projectRoot } from './utils';

export default merge(commonConfig, {
	target: 'node',
	externals: {
		electron: 'commonjs2 electron',
	},
	entry: {
		main: path.join(projectRoot, 'src/main.ts'),
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
} as Configuration);
