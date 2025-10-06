import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';
import { ConfigurableSQLBuilder } from 'nano-queries/sql/ConfigurableSQLBuilder';

export const qb = new ConfigurableSQLBuilder(
	new SQLCompiler({
		getPlaceholder(valueIndex) {
			return '$' + (valueIndex + 1);
		},
	}),
);
