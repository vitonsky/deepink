import sqlite3 from 'sqlite3';

export type DeclarativeStatement = {
	sql: string;
	params?: (string | number | null)[];
};

export class ExtendedSqliteDatabase extends sqlite3.Database {
	/**
	 * Run statements list one by one, until first error
	 * Supports transactions and executes `ROLLBACK` when any statement fails
	 *
	 * Inspired by https://stackoverflow.com/a/53321997/18680275
	 */
	public runBatch(statements: Array<DeclarativeStatement>) {
		const results: sqlite3.RunResult[] = [];

		return new Promise<sqlite3.RunResult[]>((resolve, reject) => {
			// Define alias, because callback function context contains result object, instead of DB
			const db = this;

			let statementIndex = 0;
			const runNextStatement = () => {
				const task = statements[statementIndex++];

				// End
				if (task === undefined) {
					resolve(results);
					return;
				}

				const { sql, params = [] } = task;
				db.run(sql, params, function callback(err) {
					// Collect results
					results.push(this);

					// Handle error
					if (err) {
						db.run('ROLLBACK', () => {
							reject(new Error(err + ' in statement #' + statementIndex));
						});

						// Stop execution
						return;
					}

					// Continue execution
					runNextStatement();
				});
			};

			runNextStatement();
		});
	}
}
