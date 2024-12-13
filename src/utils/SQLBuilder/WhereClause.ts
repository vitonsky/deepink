import { ConditionClause } from './ConditionClause';
import { RawQuery } from './core/RawQuery';
import { RawQueryParameter } from '.';

export class WhereClause extends RawQuery {
	protected readonly condition = new ConditionClause();
	constructor() {
		super();
	}

	public size() {
		return this.condition.size();
	}

	public and(...query: RawQueryParameter[]) {
		this.condition.and(...query);

		return this;
	}

	public or(...query: RawQueryParameter[]) {
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
