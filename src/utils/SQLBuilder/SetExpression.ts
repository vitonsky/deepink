import { RawQuery } from './core/RawQuery';
import { QuerySegment } from '.';

export class SetExpression extends RawQuery {
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
