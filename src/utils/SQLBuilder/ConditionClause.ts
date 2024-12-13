import { RawQuery } from './core/RawQuery';
import { QuerySegment, QuerySegmentOrPrimitive } from '.';

const filterOutEmptySegments = (segments: (QuerySegmentOrPrimitive | undefined)[]) =>
	segments.filter((segment) => segment !== undefined) as QuerySegmentOrPrimitive[];

export class ConditionClause extends RawQuery {
	protected readonly clauses: Array<{
		clause: QuerySegment;
		join: 'AND' | 'OR';
	}> = [];
	constructor() {
		super();
	}

	public and(...query: (QuerySegmentOrPrimitive | undefined)[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'AND',
				clause: new RawQuery(...filteredQuery),
			});
		}

		return this;
	}

	public or(...query: (QuerySegmentOrPrimitive | undefined)[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'OR',
				clause: new RawQuery(...filteredQuery),
			});
		}

		return this;
	}

	public toSQL() {
		if (this.clauses.length > 0) {
			this.clauses.forEach((clause, index) => {
				if (index === 0) {
					this.push(clause.clause);
					return;
				}

				this.push(` ${clause.join} `, clause.clause);
			});
		}

		return super.toSQL();
	}

	public size() {
		return this.clauses.length;
	}
}
