import { readFileSync } from "fs";
import { resolve } from "path";
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths(), {
		name: "vite-plugin-sql-import",
		enforce: "pre",
		load(id) {
			if (id.endsWith(".sql")) {
				const sqlContent = readFileSync(resolve(id), "utf-8");
				return `export default ${JSON.stringify(sqlContent)};`;
			}
		},
	},],
	test: {
		globals: true,
	},
});
