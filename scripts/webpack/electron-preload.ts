import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import commonConfig from './shared';
import { projectRoot } from './utils';

const getPreloadScripts = () => {
	const preloadScripts: string[] = [];
	for (const file of readdirSync(path.join(projectRoot, 'src/windows'), {
		withFileTypes: true,
	})) {
		if (!file.isDirectory()) continue;

		const preloadPath = path.resolve(
			path.join(file.parentPath, file.name, 'preload.ts'),
		);
		if (!existsSync(preloadPath) || !statSync(preloadPath).isFile()) continue;

		preloadScripts.push(preloadPath);
	}

	return preloadScripts.map((filename) => ({
		path: filename,
		name: path.basename(path.dirname(filename)),
	}));
};

export default merge(commonConfig, {
	target: 'electron-main',
	entry: {
		...Object.fromEntries(
			getPreloadScripts().map(({ name, path }) => [`window-${name}-preload`, path]),
		),
	},
	optimization: {
		// Preload script runs in isolated environment
		// there are unavailable calls for `require`,
		// so script must contain whole code in single file
		runtimeChunk: false,
	},
} as Configuration);
