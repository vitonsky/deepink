import { RawQuery } from './core/RawQuery';
import { QuerySegment } from '.';

export class GroupExpression extends RawQuery {
	constructor(...query: (QuerySegment | string)[]) {
		if (query.length === 0) {
			super();
		} else {
			super('(', ...query, ')');
		}
	}
}
