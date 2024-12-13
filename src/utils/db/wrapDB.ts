import Database from 'better-sqlite3';
import { RawQuery } from '@utils/SQLBuilder/core/RawQuery';

type ProxyMethods = keyof Pick<Database.Statement, 'all' | 'run' | 'get'>;
type WrappedDbMethods = {
	[K in ProxyMethods]: (query: RawQuery) => ReturnType<Database.Statement[K]>;
};
export const wrapDB = (db: Database.Database): WrappedDbMethods => {
	return new Proxy<any>(
		{},
		{
			get(_target, p: keyof WrappedDbMethods) {
				return (query: RawQuery) => {
					const { sql, bindings } = query.toSQL();
					try {
						return db.prepare(sql)[p](bindings);
					} catch (error) {
						console.error('SQL query', sql);
						throw error;
					}
				};
			},
		},
	);
};
