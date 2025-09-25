import { getItemByOffset } from '@utils/collections/getItemByOffset';

const createCollection = (count: number) =>
	Array.from({ length: count }, (_, i) => `item${i}`);
const collections = createCollection(10);

describe('Receive next item (positive offset)', () => {
	const cases: [number, number, string][] = [
		[1, 1, collections[2]],
		[2, 1, collections[3]],
		[5, 1, collections[6]],
		[8, 1, collections[9]],
	];
	cases.forEach(([index, offset, expected]) => {
		test(`Give item ${index}/10 with offset +${offset} to receive ${
			index + 1 + '/' + collections.length
		}`, () => {
			expect(getItemByOffset(collections, index, offset)).toBe(expected);
		});
	});
});

describe('Receive previous item (negative offset)', () => {
	const cases: [number, number, string][] = [
		[1, -1, collections[0]],
		[2, -1, collections[1]],
		[5, -1, collections[4]],
		[8, -1, collections[7]],
	];
	cases.forEach(([index, offset, expected]) => {
		test(`Give item ${index}/10 with offset +${offset} to receive ${
			index - 1 + '/' + collections.length
		}`, () => {
			expect(getItemByOffset(collections, index, offset)).toBe(expected);
		});
	});
});

describe('Circular navigation', () => {
	test('Give item 10/10 with offset 1 to receive 0/10', () => {
		expect(getItemByOffset(collections, 9, 1)).toBe(collections[0]);
	});
	test('Give item 10/10 with offset 3 to receive 2/10', () => {
		expect(getItemByOffset(collections, 9, 3)).toBe(collections[2]);
	});
	test('Give item 0/10 with offset -1 to receive 10/10', () => {
		expect(getItemByOffset(collections, 0, -1)).toBe(collections[9]);
	});
	test('Give item 0/10 with offset -3 to receive 8/10', () => {
		expect(getItemByOffset(collections, 0, -3)).toBe(collections[7]);
	});
});

describe('Special offset', () => {
	test('Give item 0/10 with offset 3 to receive 4/10', () => {
		expect(getItemByOffset(collections, 0, 3)).toBe(collections[3]);
	});
	test('Give item 0/10 with offset -3 to receive 8/10', () => {
		expect(getItemByOffset(collections, 0, -3)).toBe(collections[7]);
	});
	test('Give item 1/10 with offset 10000 to receive 1/10', () => {
		expect(getItemByOffset(collections, 1, 1000)).toBe(collections[1]);
	});
	test('Give item 1/10 with offset -10000 to receive 1/10', () => {
		expect(getItemByOffset(collections, 1, -1000)).toBe(collections[1]);
	});
});
