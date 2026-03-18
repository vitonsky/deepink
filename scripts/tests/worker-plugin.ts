import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const VIRTUAL_PREFIX = '\0vitest-worker:';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOTSTRAP_PATH = path.resolve(__dirname, 'worker-bootstrap.mjs');

/**
 * Loads the modules like `import ServiceName from "./ServiceName.worker"` as a node Worker
 */
export function workerPlugin({
	filename = /\.worker(\.ts)?$/,
}: {
	filename?: RegExp;
} = {}): Plugin {
	return {
		name: 'vitest-worker-plugin',
		enforce: 'pre',

		resolveId(id, importer) {
			if (!importer || !filename.test(id)) return;
			if (id.startsWith('\0')) return; // already virtual

			const importerPath = importer.startsWith('file://')
				? fileURLToPath(importer)
				: importer;

			if (importerPath.startsWith('\0')) return;

			let workerPath = path.resolve(path.dirname(importerPath), id);
			if (!workerPath.endsWith('.ts')) workerPath += '.ts';

			return VIRTUAL_PREFIX + workerPath;
		},

		load(id) {
			if (!id.startsWith(VIRTUAL_PREFIX)) return;

			const workerPath = id.slice(VIRTUAL_PREFIX.length);

			// language=js
			return `
import { Worker } from 'node:worker_threads';

const BOOTSTRAP  = ${JSON.stringify(BOOTSTRAP_PATH)};
const WORKER_PATH = ${JSON.stringify(workerPath)};

export default class NodeWorker extends Worker {
  constructor() {
    super(${JSON.stringify(workerPath)}, {
      execArgv: ['--import', 'tsx',  "--import", "tsconfig-paths/register.js", "--loader", "ts-node/esm"],   // enables TypeScript in the thread
    });
  }
}
      `.trim();
		},
	};
}
