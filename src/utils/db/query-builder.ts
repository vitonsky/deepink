import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';
import { ConfigurableSQLBuilder } from 'nano-queries/sql/ConfigurableSQLBuilder';

export type DBPrimitiveTypes = string | number | null | boolean;
export type DBTypes = DBPrimitiveTypes | DBPrimitiveTypes[];

export const qb = new ConfigurableSQLBuilder(
	new SQLCompiler<DBTypes>({
		getPlaceholder(valueIndex) {
			return '$' + (valueIndex + 1);
		},
	}),
);
