import { Query } from 'nano-queries/core/Query';
import { z } from 'zod';
import { ExtendedPGLite } from '@core/storage/database/pglite/ExtendedPGLite';
import { Results, Transaction } from '@electric-sql/pglite';

import { DBTypes, qb } from './query-builder';

type WrappedDbMethods = {
	query: <S extends z.ZodType>(
		query: Query<DBTypes>,
		scheme?: S,
	) => Promise<Results<z.TypeOf<S>>>;
};
export const wrapDB = (db: ExtendedPGLite | Transaction): WrappedDbMethods => {
	return new Proxy<any>(
		{},
		{
			get(_target, _propertyName: keyof WrappedDbMethods) {
				return async (query: Query, scheme?: z.ZodType) => {
					const { sql, bindings } = qb.toSQL(query);
					try {
						const result = await db.query(sql, bindings);
						// console.log("DBG", result.rows);

						if (scheme) {
							result.rows = scheme.array().parse(result.rows);
						}

						return result;
					} catch (error) {
						console.error('SQL query', sql);
						throw error;
					}
				};
			},
		},
	);
};
