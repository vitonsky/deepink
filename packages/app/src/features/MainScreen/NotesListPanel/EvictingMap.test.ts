import { EvictingMap } from './EvictingMap';

const createPayload = (prefix: string, size: number) =>
	Array(size)
		.fill(null)
		.map((_, index) => [prefix + '_' + String(index + 1), 0] as const);

test('Old values must be evicted', () => {
	const map = new EvictingMap<number>({ size: 100 });

	expect(map.getAll()).toEqual([]);

	const payload1 = createPayload('1', 100);
	map.add(payload1);
	expect(map.getAll()).toEqual(payload1);
	expect(map.getAll()).toHaveLength(100);

	const payload2 = createPayload('2', 10);
	map.add(payload2);
	expect(map.getAll()).toEqual(
		[...payload1, ...payload2].reverse().slice(0, 100).reverse(),
	);
	expect(map.getAll()).toHaveLength(100);

	expect(map.has('1_10')).toBe(false);
	expect(map.has('1_11')).toBe(true);
	expect(map.has('1_100')).toBe(true);

	expect(map.has('2_1')).toBe(true);
	expect(map.has('2_10')).toBe(true);
});

test('Update of exist value must not evict data', () => {
	const map = new EvictingMap<number>({ size: 100 });

	expect(map.getAll()).toEqual([]);

	const payload1 = createPayload('1', 100);
	map.add(payload1);
	expect(map.getAll()).toEqual(payload1);
	expect(map.getAll()).toHaveLength(100);

	expect(map.getAll().map(([key]) => key)).toContainEqual('1_1');
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_100');

	map.add({ '1_100': 1 });
	expect(map.getAll()).toHaveLength(100);
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_1');
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_100');

	map.add({ '1_50': 1 });
	expect(map.getAll()).toHaveLength(100);
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_1');
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_100');

	map.add({ '1_1': 1 });
	expect(map.getAll()).toHaveLength(100);
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_1');
	expect(map.getAll().map(([key]) => key)).toContainEqual('1_100');
});
