export class RawValue {
	protected readonly value;
	constructor(value: string | number) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}

export class Placeholder extends RawValue {}

export type QuerySegment = RawValue | RawQuery | Placeholder;

// export type CompilerOptions = {
// 	getPlaceholder?: () => string;
// }

/**
 * Trivial query builder that return SQL and bindings
 */
export class RawQuery {
	protected readonly query: QuerySegment[] = [];
	constructor(...query: (QuerySegment | string)[]) {
		if (query) {
			this.push(...query);
		}
	}

	public size() {
		return this.query.length;
	}

	public toSQL() {
		let sql = '';
		const bindings: Array<string | number> = [];
		for (const segment of this.query) {
			if (segment instanceof RawQuery) {
				const data = segment.toSQL();
				sql += data.sql;
				bindings.push(...data.bindings);
				continue;
			}

			if (segment instanceof Placeholder) {
				sql += '?';
				bindings.push(segment.getValue());
				continue;
			}

			sql += segment.getValue();
		}

		return { sql, bindings };
	}

	protected push(...queries: (QuerySegment | string)[]) {
		this.query.push(
			...queries.map((segment) =>
				typeof segment === 'string' ? new RawValue(segment) : segment,
			),
		);
	}
}

export class QueryConstrictor extends RawQuery {
	public getPlaceholder = (value: string | number) => {
		return new Placeholder(value);
	};

	public add(...queries: (QuerySegment | string)[]) {
		this.push(...queries);
	}
}

export class GroupExpression extends RawQuery {
	constructor(...query: (QuerySegment | string)[]) {
		if (query.length === 0) {
			super();
		} else {
			super('(', ...query, ')');
		}
	}
}

export class ListExpression extends RawQuery {
	constructor(...query: (QuerySegment | string)[]) {
		super();

		if (query.length > 0) {
			this.push('(');
			query.forEach((item, index) => {
				if (index > 0) {
					this.push(',');
				}

				this.push(item);
			});
			this.push(')');
		}
	}
}

export class Limit extends RawQuery {
	constructor({ limit, offset }: { limit?: number; offset?: number }) {
		super();

		if (limit) {
			this.push(`LIMIT ${limit}`);
		}

		if (offset) {
			if (limit) {
				this.push(' ');
			}

			this.push(`OFFSET ${offset}`);
		}
	}
}

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

export class WhereClause extends RawQuery {
	protected readonly condition = new ConditionClause();
	constructor() {
		super();
	}

	public and(...query: (QuerySegment | string)[]) {
		this.condition.and(...query);

		return this;
	}

	public or(...query: (QuerySegment | string)[]) {
		this.condition.or(...query);

		return this;
	}

	public toSQL() {
		if (this.condition.size() > 0) {
			this.push('WHERE ', this.condition);
		}

		return super.toSQL();
	}
}
