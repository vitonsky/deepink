import { RawQuery } from './core/RawQuery';
import { QuerySegment } from '.';

export class ConditionClause extends RawQuery {
	protected readonly clauses: Array<{
		clause: QuerySegment;
		join: 'AND' | 'OR';
	}> = [];
	constructor() {
		super();
	}

	public and(...query: (QuerySegment | string)[]) {
		this.clauses.push({
			join: 'AND',
			clause: new RawQuery(...query),
		});

		return this;
	}

	public or(...query: (QuerySegment | string)[]) {
		this.clauses.push({
			join: 'OR',
			clause: new RawQuery(...query),
		});

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
