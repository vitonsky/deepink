import { PreparedValue } from '../core/PreparedValue';
import { RawQuery } from '../core/RawQuery';
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
		return new PreparedValue(value);
	};

	public add(...queries: (QuerySegment | string)[]) {
		const { join } = this.options;
		queries.forEach((segment, index) => {
			// Add divider between segments
			if (index > 0 && join !== null) {
				this.push(join);
			}

			this.push(segment);
		});

		return this;
	}
}
