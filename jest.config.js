const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

const jestGlobals = {};

const testPathIgnorePatterns = [];

// Speedup tests
if (process.env.TEST_FAST) {
	// Disable type checking
	const RED_COLOR = '\x1b[31m';
	console.warn(RED_COLOR, 'TESTS DO NOT CHECK A TYPES!\n\n');

	jestGlobals['ts-jest'] = {
		isolatedModules: true,
	};

	// Skip performance tests
	testPathIgnorePatterns.push('.performance.test.[jt]sx?$');
}

module.exports = {
	testEnvironment: 'node',
	preset: 'ts-jest/presets/js-with-ts-esm',
	...(Object.keys(jestGlobals).length === 0 ? {} : { globals: jestGlobals }),

	testPathIgnorePatterns,

	resetMocks: true,
	setupFiles: ['./scripts/jest/setupFiles/index.js'],
	transform: {
		'\\.sql$': '<rootDir>/scripts/jest/fileTransformer.js',
	},

	// Use paths in tsconfig: https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping/
	roots: ['<rootDir>'],
	modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
	moduleNameMapper: pathsToModuleNameMapper(
		compilerOptions.paths /*, { prefix: '<rootDir>/' } */,
	),
};
