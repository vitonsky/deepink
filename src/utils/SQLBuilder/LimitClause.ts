import { RawQuery } from './core/RawQuery';

export class LimitClause extends RawQuery {
	constructor({ limit, offset }: { limit?: number; offset?: number }) {
		super();

		if (limit) {
			this.push(`LIMIT ${limit}`);
		}

		if (offset) {
			if (limit) {
				this.push(' ');
			}

			this.push(`OFFSET ${offset}`);
		}
	}
}