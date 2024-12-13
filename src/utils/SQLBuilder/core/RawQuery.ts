import { PreparedValue } from './PreparedValue';
import { RawValue } from './RawValue';
import { QuerySegment, QuerySegmentOrPrimitive } from '..';

// export type CompilerOptions = {
// 	getPlaceholder?: () => string;
// }
/**
 * Trivial query builder that return SQL and bindings
 */

export class RawQuery {
	protected readonly query: QuerySegment[] = [];
	constructor(...query: QuerySegmentOrPrimitive[]) {
		if (query) {
			this.push(...query);
		}
	}

	/**
	 * Returns query segments number
	 */
	public size() {
		return this.query.length;
	}

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used while compile SQL
	 */
	public exportQuery() {
		return this.query;
	}

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL() {
		let sql = '';
		const bindings: Array<string | number> = [];
		for (const segment of this.exportQuery()) {
			if (segment instanceof RawQuery) {
				const data = segment.toSQL();
				sql += data.sql;
				bindings.push(...data.bindings);
				continue;
			}

			if (segment instanceof PreparedValue) {
				sql += '?';
				bindings.push(segment.getValue());
				continue;
			}

			sql += segment.getValue();
		}

		return { sql, bindings };
	}

	protected push(...queries: QuerySegmentOrPrimitive[]) {
		this.query.push(
			...queries.map((segment) => {
				switch (typeof segment) {
					case 'string':
					case 'number':
						return new RawValue(segment);

					default:
						return segment;
				}
			}),
		);
	}
}
