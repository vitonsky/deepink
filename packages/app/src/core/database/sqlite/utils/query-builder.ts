import { ConfigurableSQLBuilder, SQLCompiler } from 'nano-queries';
import type sqlite from 'sql.js';

export type DBTypes = sqlite.SqlValue;

export const qb = new ConfigurableSQLBuilder(
	new SQLCompiler<DBTypes>({
		getPlaceholder() {
			return '?';
		},
	}),
);
