import { findTextSegments } from './search';

test('No results for empty strings', () => {
	expect(
		findTextSegments('The quick brown fox jumps over the lazy dog', 'cool car'),
	).toEqual([]);
});

test('Exact words in string must be found', () => {
	const input = 'The quick brown fox jumps over the lazy dog';
	const segments = findTextSegments(input, 'fox dog');

	expect(segments).toHaveLength(2);
	expect(
		segments.map(({ start, end }) => input.slice(start, end)),
		'Slice by range must return search terms',
	).toEqual(['fox', 'dog']);
});

test('When limit passed, search is in lazy mode and must be stopped when find enough segments', () => {
	const input = 'The quick brown fox jumps over the lazy dog';

	expect(
		findTextSegments(input, 'fox dog', { limit: 0 }).map(({ start, end }) =>
			input.slice(start, end),
		),
		'No results for limit 0',
	).toStrictEqual([]);

	expect(
		findTextSegments(input, 'fox dog', { limit: 1 }).map(({ start, end }) =>
			input.slice(start, end),
		),
		'Slice by range must return search terms',
	).toStrictEqual(['fox']);

	expect(
		findTextSegments(input, 'fox dog', { limit: 1000 }).map(({ start, end }) =>
			input.slice(start, end),
		),
		'Only exists results is returned',
	).toStrictEqual(['fox', 'dog']);
});

test('Words with typo must be found', () => {
	const input = 'The quick red fox jumped high above the hedge';
	const segments = findTextSegments(input, 'qick');

	expect(segments).toHaveLength(1);
	expect(
		segments.map(({ start, end }) => input.slice(start, end)),
		'Slice by range must return search terms',
	).toEqual(['quick']);
});

test('Segments must be joined by distance', () => {
	const input = 'The quick red fox jumped high above the hedge';
	expect(
		findTextSegments(input, 'quick fox', { joinDistance: 5 }).map(({ start, end }) =>
			input.slice(start, end),
		),
		'segments that are enough close is joined',
	).toEqual(['quick red fox']);

	expect(
		findTextSegments(input, 'quick fox', {
			joinDistance: Number.MAX_SAFE_INTEGER,
		}).map(({ start, end }) => input.slice(start, end)),
		'segments that are enough close is joined',
	).toEqual(['quick red fox']);

	expect(
		findTextSegments(input, 'quick fox', { joinDistance: 4 }).map(({ start, end }) =>
			input.slice(start, end),
		),
		'segments not joined since distance is too large',
	).toEqual(['quick', 'fox']);
});
