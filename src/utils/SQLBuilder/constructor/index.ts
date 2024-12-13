import { ConditionClause } from '../ConditionClause';
import { PreparedValue } from '../core/PreparedValue';
import { GroupExpression } from '../GroupExpression';
import { LimitClause } from '../LimitClause';
import { SetExpression } from '../SetExpression';
import { QueryConstructor } from '../utils/QueryConstructor';
import { WhereClause } from '../WhereClause';
import { QuerySegmentOrPrimitive } from '..';

/**
 * SQL query builder
 */
export const qb = {
	raw: (...segments: QuerySegmentOrPrimitive[]) =>
		new QueryConstructor().raw(...segments),
	line: (...segments: QuerySegmentOrPrimitive[]) =>
		new QueryConstructor({ join: ' ' }).raw(...segments),
	group: (...segments: QuerySegmentOrPrimitive[]) => new GroupExpression(...segments),
	set: (segments: QuerySegmentOrPrimitive[]) => new SetExpression(...segments),
	values: (values: Array<string | number>) =>
		new SetExpression(...values.map((value) => new PreparedValue(value))),
	where: (...segments: QuerySegmentOrPrimitive[]) => new WhereClause().and(...segments),
	condition: (...segments: QuerySegmentOrPrimitive[]) =>
		new ConditionClause().and(...segments),
	limit: (limit?: number) => new LimitClause({ limit }),
	offset: (offset?: number) => new LimitClause({ offset }),
};
