import { RawQuery } from './core/RawQuery';
import { QueryConstructor } from './utils/QueryConstructor';
import { QuerySegment } from '.';

export class SetExpression extends RawQuery {
	public exportQuery(): QuerySegment[] {
		const query = new QueryConstructor();

		query.raw('(');
		super.exportQuery().forEach((item, index) => {
			query.raw(index > 0 ? ',' : undefined, item);
		});
		query.raw(')');

		return query.exportQuery();
	}
}
