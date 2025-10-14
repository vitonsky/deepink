import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { worker } from '@electric-sql/pglite/worker';

import { ExtendedPGLite } from './ExtendedPGLite';

worker({
	async init(options) {
		// Create and return a PGlite instance
		return new ExtendedPGLite({
			...options,
			extensions: { pg_trgm },
		});
	},
});
