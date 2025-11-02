import path from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './shared';
import { getAppWindows, projectRoot } from './utils';

export default merge(commonConfig, {
	target: 'node',
	externals: {
		electron: 'commonjs2 electron',
	},
	entry: {
		...Object.fromEntries(
			getAppWindows()
				.filter((win) => win.preloadScript)
				.map(({ name, preloadScript }) => [
					`window-${name}-preload`,
					path.join(projectRoot, preloadScript!),
				]),
		),
	},
	optimization: {
		// Preload script runs in isolated environment
		// there are unavailable calls for `require`,
		// so script must contain whole code in single file
		runtimeChunk: false,
	},
} as Configuration);
