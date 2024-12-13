import { RawQuery } from './core/RawQuery';
import { RawQueryParameter } from '.';

export class SetExpression extends RawQuery {
	constructor(...query: RawQueryParameter[]) {
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
