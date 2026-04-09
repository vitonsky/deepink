import { defineConfig } from 'tsdown';

export default defineConfig({
	clean: false,
	dts: true,
	exports: {
		customExports: {
			'./twofish.wasm': './dist/twofish.wasm',
		},
	},
});
