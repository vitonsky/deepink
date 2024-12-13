import { PreparedValue } from '../core/PreparedValue';
import { RawQuery } from '../core/RawQuery';
import { QuerySegment } from '..';

export class QueryConstructor extends RawQuery {
	public value = (value: string | number) => {
		return new PreparedValue(value);
	};

	public add(...queries: (QuerySegment | string)[]) {
		this.push(...queries);
	}
}
