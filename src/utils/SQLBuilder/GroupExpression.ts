import { RawQuery } from './core/RawQuery';
import { QuerySegmentOrPrimitive } from '.';

export class GroupExpression extends RawQuery {
	constructor(...query: QuerySegmentOrPrimitive[]) {
		if (query.length === 0) {
			super();
		} else {
			super('(', ...query, ')');
		}
	}
}
