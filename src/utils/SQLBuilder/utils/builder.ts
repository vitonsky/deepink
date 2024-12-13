import { ConditionClause } from '../ConditionClause';
import { PreparedValue } from '../core/PreparedValue';
import { GroupExpression } from '../GroupExpression';
import { LimitClause } from '../LimitClause';
import { SetExpression } from '../SetExpression';
import { WhereClause } from '../WhereClause';
import { QueryConstructor } from './QueryConstructor';
import { RawQueryParameter } from '..';

/**
 * SQL query builder
 */
export const qb = {
	raw: (...segments: RawQueryParameter[]) => new QueryConstructor().raw(...segments),
	line: (...segments: RawQueryParameter[]) =>
		new QueryConstructor({ join: ' ' }).raw(...segments),
	group: (...segments: RawQueryParameter[]) => new GroupExpression(...segments),
	set: (segments: RawQueryParameter[]) => new SetExpression(...segments),
	values: (values: Array<string | number>) =>
		new SetExpression(...values.map((value) => new PreparedValue(value))),
	where: (...segments: RawQueryParameter[]) => new WhereClause().and(...segments),
	condition: (...segments: RawQueryParameter[]) =>
		new ConditionClause().and(...segments),
	limit: (limit?: number) => new LimitClause({ limit }),
	offset: (offset?: number) => new LimitClause({ offset }),
};
