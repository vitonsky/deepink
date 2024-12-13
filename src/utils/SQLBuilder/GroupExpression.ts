import { RawQuery } from './core/RawQuery';

export class GroupExpression extends RawQuery {
	public exportQuery() {
		const segments = super.exportQuery();

		if (segments.length === 0) return [];

		return [new RawQuery('('), ...segments, new RawQuery(')')];
	}
}
