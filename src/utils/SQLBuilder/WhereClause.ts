import { ConditionClause } from './ConditionClause';
import { RawQuery } from './core/RawQuery';
import { QueryConstructor } from './utils/QueryConstructor';
import { QuerySegment, RawQueryParameter } from '.';

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

	public exportQuery(): QuerySegment[] {
		if (this.condition.size() === 0) return [];

		return new QueryConstructor({ join: ' ' })
			.raw('WHERE', this.condition)
			.exportQuery();
	}
}
