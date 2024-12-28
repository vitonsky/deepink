import Database from 'better-sqlite3';
import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';
import { Query } from 'nano-queries/core/Query';

type ProxyMethods = keyof Pick<Database.Statement, 'all' | 'run' | 'get'>;
type WrappedDbMethods = {
	[K in ProxyMethods]: (query: Query) => ReturnType<Database.Statement[K]>;
};
export const wrapDB = (db: Database.Database): WrappedDbMethods => {
	const compiler = new SQLCompiler();
	return new Proxy<any>(
		{},
		{
			get(_target, p: keyof WrappedDbMethods) {
				return (query: Query) => {
					const { sql, bindings } = compiler.toSQL(query);
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
