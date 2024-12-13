import { RawQuery } from './core/RawQuery';
import { QueryConstructor } from './utils/QueryConstructor';
import { QuerySegment } from '.';

export class LimitClause extends RawQuery {
	private readonly state;
	constructor(state: { limit?: number; offset?: number }) {
		super();
		this.state = state;
	}

	public exportQuery(): QuerySegment[] {
		const { limit, offset } = this.state;

		const query = new QueryConstructor({ join: ' ' });

		if (limit) {
			query.raw('LIMIT').value(limit);
		}

		if (offset) {
			query.raw('OFFSET').value(offset);
		}

		return query.exportQuery();
	}
}
