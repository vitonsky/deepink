import { PreparedValue } from '../core/PreparedValue';
import { RawQuery } from '../core/RawQuery';
import { RawValue } from '../core/RawValue';
import { QuerySegment } from '..';

export type QueryConstructorOptions = {
	join?: string | null;
};

export class QueryConstructor extends RawQuery {
	private readonly options;
	constructor({ join = null }: QueryConstructorOptions = {}) {
		super();

		this.options = { join };
	}

	public value = (value: string | number) => {
		return this.raw(new PreparedValue(value));
	};

	public raw(...queries: (QuerySegment | string)[]) {
		this.push(...queries);
		return this;
	}

	public exportQuery() {
		const { join } = this.options;

		const preparedQuery: QuerySegment[] = [];
		this.query.forEach((segment, index) => {
			// Add divider between segments
			if (index > 0 && join !== null) {
				preparedQuery.push(new RawValue(join));
			}

			preparedQuery.push(segment);
		});

		return preparedQuery;
	}
}
