import z from 'zod';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { worker } from '@electric-sql/pglite/worker';

import { ExtendedPGLite } from './ExtendedPGLite';
import { WorkerEventMessageScheme } from './ExtendedPGliteWorker';

worker({
	async init(options) {
		// Create and return a PGlite instance
		const db = new ExtendedPGLite({
			...options,
			extensions: { pg_trgm },
		});

		db.on('sync', () => {
			self.postMessage({
				type: 'worker.event',
				event: {
					name: 'sync',
				},
			} satisfies z.TypeOf<typeof WorkerEventMessageScheme>);
		});

		return db;
	},
});
