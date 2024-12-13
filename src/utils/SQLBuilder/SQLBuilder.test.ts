import { ConditionClause } from './ConditionClause';
import { qb } from './constructor';
import { PreparedValue } from './core/PreparedValue';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SetExpression } from './SetExpression';
import { QueryConstructor } from './utils/QueryConstructor';
import { WhereClause } from './WhereClause';

describe('Primitives', () => {
	test('Query constructor able to add queries one by one', () => {
		expect(
			new QueryConstructor({ join: null })
				.raw('SELECT * FROM foo WHERE foo=')
				.value(1)
				.raw(' LIMIT 2')
				.toSQL(),
		).toEqual({
			sql: 'SELECT * FROM foo WHERE foo=? LIMIT 2',
			bindings: [1],
		});
	});

	test('Query constructors may be nested', () => {
		expect(
			new QueryConstructor({ join: null })
				.raw(
					'SELECT * FROM foo WHERE foo IN ',
					new QueryConstructor({ join: null })
						.raw('(SELECT id FROM bar WHERE x > ')
						.value(100)
						.raw(')'),
				)
				.toSQL(),
		).toEqual({
			sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
			bindings: [100],
		});
	});

	test('Query constructors may be nested with no introduce a variables', () => {
		const query = new QueryConstructor({ join: null }).raw(
			'SELECT * FROM foo WHERE foo IN ',
			new QueryConstructor({ join: null }).raw(
				'(SELECT id FROM bar WHERE x > ',
				new PreparedValue(100),
				')',
			),
		);

		expect(query.toSQL()).toEqual({
			sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
			bindings: [100],
		});
	});
});

describe('Basic clauses', () => {
	describe('Group expressions', () => {
		test('Empty group expression yields empty query', () => {
			expect(new GroupExpression().toSQL()).toEqual({
				sql: '',
				bindings: [],
			});
		});

		test('Nested group expression yields correct query', () => {
			expect(
				new GroupExpression(
					new GroupExpression(new PreparedValue(1)),
					' OR ',
					new GroupExpression(new PreparedValue(2)),
				).toSQL(),
			).toEqual({
				sql: '((?) OR (?))',
				bindings: [1, 2],
			});
		});
	});

	describe('Set expression', () => {
		test('Set with literals', () => {
			expect(new SetExpression('foo', 'bar', 'baz').toSQL()).toEqual({
				sql: '(foo,bar,baz)',
				bindings: [],
			});
		});
		test('Nested sets', () => {
			expect(
				new SetExpression('foo', new SetExpression('bar', 'baz')).toSQL(),
			).toEqual({
				sql: '(foo,(bar,baz))',
				bindings: [],
			});
		});
	});

	describe('Limit expression', () => {
		test('Limit', () => {
			expect(new LimitClause({ limit: 10 }).toSQL()).toEqual({
				sql: 'LIMIT 10',
				bindings: [],
			});
		});
		test('Offset', () => {
			expect(new LimitClause({ offset: 20 }).toSQL()).toEqual({
				sql: 'OFFSET 20',
				bindings: [],
			});
		});
		test('Limit and offset', () => {
			expect(new LimitClause({ limit: 10, offset: 20 }).toSQL()).toEqual({
				sql: 'LIMIT 10 OFFSET 20',
				bindings: [],
			});
		});
	});

	describe('Condition expression', () => {
		test('Empty condition generates empty query', () => {
			const query = new ConditionClause();

			expect(query.toSQL()).toEqual({
				sql: '',
				bindings: [],
			});
			expect(query.size()).toBe(0);
		});

		test('Single condition yields just a literal', () => {
			expect(
				new ConditionClause().and('x > ', new PreparedValue(0)).toSQL(),
			).toEqual({
				sql: 'x > ?',
				bindings: [0],
			});

			expect(
				new ConditionClause().or('x > ', new PreparedValue(0)).toSQL(),
			).toEqual({
				sql: 'x > ?',
				bindings: [0],
			});
		});

		test('Trivial condition expression yields sql expression', () => {
			expect(
				new ConditionClause()
					.and('x > ', new PreparedValue(0))
					.or('y < ', new PreparedValue(1))
					.toSQL(),
			).toEqual({
				sql: 'x > ? OR y < ?',
				bindings: [0, 1],
			});
		});

		test('Complex condition expression consider a grouping', () => {
			const query = new QueryConstructor({ join: null }).raw(
				'SELECT * FROM foo WHERE ',
				new ConditionClause()
					.and('x > ', new PreparedValue(0))
					.or(
						new GroupExpression(
							new ConditionClause()
								.and('y=', new PreparedValue(1))
								.and('z=', new PreparedValue(2)),
						),
					),
			);

			expect(query.toSQL()).toEqual({
				sql: 'SELECT * FROM foo WHERE x > ? OR (y=? AND z=?)',
				bindings: [0, 1, 2],
			});
		});
	});

	describe('Where clause', () => {
		test('Where clause may be filled after join', () => {
			const where = new WhereClause();
			const query = new QueryConstructor({ join: null }).raw(
				'SELECT * FROM foo ',
				where,
			);

			// Fill where after build a query object
			where
				.and('x > ', new PreparedValue(0))
				.or(
					new GroupExpression(
						new ConditionClause()
							.and('y=', new PreparedValue(1))
							.and('z=', new PreparedValue(2)),
					),
				);

			expect(query.toSQL()).toEqual({
				sql: 'SELECT * FROM foo WHERE x > ? OR (y=? AND z=?)',
				bindings: [0, 1, 2],
			});
		});

		test('Empty where clause generates empty query', () => {
			expect(new WhereClause().toSQL()).toEqual({
				sql: '',
				bindings: [],
			});
		});
	});
});

describe('utils', () => {
	test('Complex query building', () => {
		expect(
			qb
				.line(
					qb.raw('SELECT * FROM notes'),
					qb.where(
						qb
							.condition(qb.raw('workspace_id=').value('fake-uuid'))
							.and(
								qb
									.line('id IN')
									.raw(
										qb.group(
											qb
												.line('SELECT target FROM attachedTags')
												.raw(
													qb.where(
														qb
															.line('source IN')
															.raw(qb.values([1, 2, 3])),
													),
												),
										),
									),
							),
					),
					qb.limit(20),
					qb.offset(10),
				)
				.toSQL(),
		).toEqual({
			sql: 'SELECT * FROM notes WHERE workspace_id=? AND id IN (SELECT target FROM attachedTags WHERE source IN (?,?,?)) LIMIT 20 OFFSET 10',
			bindings: ['fake-uuid', 1, 2, 3],
		});
	});
});
