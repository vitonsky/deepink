import { ConditionClause } from './ConditionClause';
import { PreparedValue } from './core/PreparedValue';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SetExpression } from './SetExpression';
import { QueryConstructor } from './utils/QueryConstructor';
import { WhereClause } from './WhereClause';

describe('Primitives', () => {
	test('Query constructor able to add queries one by one', () => {
		const query = new QueryConstructor({ join: null });
		query.add('SELECT * FROM foo WHERE foo=', query.value(1));
		query.add(' LIMIT 2');

		expect(query.toSQL()).toEqual({
			sql: 'SELECT * FROM foo WHERE foo=? LIMIT 2',
			bindings: [1],
		});
	});

	test('Query constructors may be nested', () => {
		const query1 = new QueryConstructor({ join: null });

		const query2 = new QueryConstructor({ join: null });
		query2.add('(SELECT id FROM bar WHERE x > ', query2.value(100), ')');
		query1.add('SELECT * FROM foo WHERE foo IN ', query2);

		expect(query1.toSQL()).toEqual({
			sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
			bindings: [100],
		});
	});

	test('Query constructors may be nested with no introduce a variables', () => {
		const query = new QueryConstructor({ join: null }).add(
			'SELECT * FROM foo WHERE foo IN ',
			new QueryConstructor({ join: null }).add(
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
			const query = new QueryConstructor({ join: null }).add(
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
			const query = new QueryConstructor({ join: null }).add(
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
