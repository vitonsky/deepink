import { RawQuery } from './core/RawQuery';
import { SetExpression } from './SetExpression';
import { IQuery, QueryParameter, QuerySegment } from './types';
import { QueryConstructor } from './utils/QueryConstructor';
import { WhereClause } from './WhereClause';

export class SelectStatement extends RawQuery implements IQuery {
	private readonly _select: QueryParameter[] = [];
	private readonly _from: QueryParameter[] = [];
	private readonly _where = new WhereClause();

	public select(...params: QueryParameter[]) {
		this._select.push(...params);
		return this;
	}

	public from(...params: QueryParameter[]) {
		this._from.push(...params);
		return this;
	}

	public where(params: QueryParameter[], condition: 'and' | 'or' = 'and') {
		this._where[condition](...params);
		return this;
	}

	public exportQuery(): QuerySegment[] {
		const query = new QueryConstructor({ join: ' ' });

		query.raw('SELECT');

		if (this._select.length > 0) {
			query.raw(new SetExpression(...this._select));
		} else {
			query.raw('*');
		}

		if (this._from.length === 0) throw TypeError('Not set FROM clause');
		query.raw('FROM', ...this._from);

		query.raw(this._where);

		return query.exportQuery();
	}
}
