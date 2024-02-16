'use strict';

const fs = require('fs');
const path = require('path');

function findDirWithFile(filename) {
	let dir = path.resolve(filename);

	do {
		dir = path.dirname(dir);
	} while (!fs.existsSync(path.join(dir, filename)) && dir !== '/');

	if (!fs.existsSync(path.join(dir, filename))) {
		return;
	}

	return dir;
}

function findAlias(baseDir, importPath, filePath, ignoredPaths = []) {
	if (fs.existsSync(path.join(baseDir, 'tsconfig.json'))) {
		const tsconfig = JSON.parse(
			fs.readFileSync(path.join(baseDir, 'tsconfig.json')).toString('utf8'),
		);

		const paths = tsconfig?.compilerOptions?.paths ?? {};
		for (const [alias, aliasPaths] of Object.entries(paths)) {
			// TODO: support full featured glob patterns instead of trivial cases like `@utils/*` and `src/utils/*`
			const matchedPath = aliasPaths.find((dirPath) => {
				// Remove last asterisk
				const dirPathBase = path
					.join(baseDir, dirPath)
					.split('/')
					.slice(0, -1)
					.join('/');

				if (filePath.startsWith(dirPathBase)) return false;
				if (
					ignoredPaths.some((ignoredPath) =>
						ignoredPath.startsWith(dirPathBase),
					)
				)
					return false;

				return importPath.startsWith(dirPathBase);
			});

			if (!matchedPath) continue;

			// Split import path
			// Remove basedir and slash in start
			const importPathSegments = importPath.slice(baseDir.length + 1).split('/');
			const matchedPathSegments = matchedPath.split('/');

			let slicedImportPath = null;
			for (let i = 1; i < importPathSegments.length; i++) {
				// Find segment that does not match
				const isMatch =
					importPathSegments.slice(0, i).join('/') ===
					matchedPathSegments.slice(0, i).join('/');
				if (!isMatch) {
					// One step back
					slicedImportPath = importPathSegments.slice(i - 1).join('/');
					break;
				}
			}

			if (!slicedImportPath) continue;

			// Remove asterisk from end of alias
			return path.join(alias.split('/').slice(0, -1).join('/'), slicedImportPath);
		}
	}

	return null;
}

// TODO: implement option to force relative path instead of alias (for remove alias case)
// TODO: add tests
// TODO: move to package
module.exports = {
	'proper-import-aliases': {
		meta: {
			fixable: true,
		},
		create: function (context) {
			const baseDir = findDirWithFile('package.json');

			return {
				ImportDeclaration(node) {
					const [{ ignoredPaths = [] } = {}] = context.options;

					const resolvedIgnoredPaths = ignoredPaths.map((ignoredPath) =>
						path.normalize(path.join(path.dirname(filename), ignoredPath)),
					);

					const source = node.source.value;
					if (source.startsWith('.')) {
						const filename = context.getFilename();

						const absolutePath = path.normalize(
							path.join(path.dirname(filename), source),
						);

						const replacement = findAlias(
							baseDir,
							absolutePath,
							filename,
							resolvedIgnoredPaths,
						);

						if (!replacement) return;

						context.report({
							node,
							message: `Update import to ${replacement}`,
							fix: function (fixer) {
								// TODO: preserve quotes
								const quote = `'`;
								return fixer.replaceText(
									node.source,
									quote + replacement + quote,
								);
							},
						});
					}
				},
			};
		},
	},
};
