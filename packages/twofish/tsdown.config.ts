import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	exports: {
		customExports: {
			'./twofish.wasm': './dist/twofish.wasm',
		},
	},
	clean: false,
	// ...config options
});
