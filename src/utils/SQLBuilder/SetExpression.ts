import { RawQuery } from './core/RawQuery';
import { IQuery, QuerySegment } from './types';
import { QueryConstructor } from './utils/QueryConstructor';

export class SetExpression extends RawQuery implements IQuery {
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
