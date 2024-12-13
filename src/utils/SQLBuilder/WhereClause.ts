import { ConditionClause } from './ConditionClause';
import { RawQuery } from './core/RawQuery';
import { QuerySegmentOrPrimitive } from '.';

export class WhereClause extends RawQuery {
	protected readonly condition = new ConditionClause();
	constructor() {
		super();
	}

	public and(...query: QuerySegmentOrPrimitive[]) {
		this.condition.and(...query);

		return this;
	}

	public or(...query: QuerySegmentOrPrimitive[]) {
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
