import { getItemByOffset } from '@utils/collections/getItemByOffset';

const collection = Array.from({ length: 10 }, (_, i) => `item${i}`);

test('Return null if the collection is smaller than 2; otherwise, return the item', () => {
	expect(getItemByOffset([], 0, 1)).toBe(null);
	expect(getItemByOffset([1], 0, 1)).toBe(null);
	expect(getItemByOffset([1, 2], 0, 1)).toBe(2);
});
test('Returns null for an index outside the collection', () => {
	expect(getItemByOffset([1, 2, 3], 67, 1)).toBe(null);
});

describe('Receive next item (positive offset)', () => {
	test('Give item 0/10 with offset 1 to receive 1/10', () => {
		expect(getItemByOffset(collection, 0, 1)).toBe(collection[1]);
	});
	test('Give item 1/10 with offset 1 to receive 2/10', () => {
		expect(getItemByOffset(collection, 1, 1)).toBe(collection[2]);
	});
	test('Give item 2/10 with offset 1 to receive 3/10', () => {
		expect(getItemByOffset(collection, 2, 1)).toBe(collection[3]);
	});
	test('Give item 5/10 with offset 1 to receive 6/10', () => {
		expect(getItemByOffset(collection, 5, 1)).toBe(collection[6]);
	});
});

describe('Receive previous item (negative offset)', () => {
	test('Give item 0/10 with offset -1 to receive 10/10', () => {
		expect(getItemByOffset(collection, 0, -1)).toBe(collection[9]);
	});
	test('Give item 9/10 with offset -1 to receive 8/10', () => {
		expect(getItemByOffset(collection, 9, -1)).toBe(collection[8]);
	});
	test('Give item 8/10 with offset -1 to receive 7/10', () => {
		expect(getItemByOffset(collection, 8, -1)).toBe(collection[7]);
	});
	test('Give item 5/10 with offset -1 to receive 4/10', () => {
		expect(getItemByOffset(collection, 5, -1)).toBe(collection[4]);
	});
});

describe('Circular navigation', () => {
	test('Give the last item with offset 1 to get the first item of 10', () => {
		expect(getItemByOffset(collection, 9, 1)).toBe(collection[0]);
	});
	test('Give the last item with offset 3 to get the third item of 10', () => {
		expect(getItemByOffset(collection, 9, 3)).toBe(collection[2]);
	});
	test('Give the first item with offset -1 to get the last item of 10', () => {
		expect(getItemByOffset(collection, 0, -1)).toBe(collection[9]);
	});
	test('Give the first item with offset -3 to get the eighth item of 10', () => {
		expect(getItemByOffset(collection, 0, -3)).toBe(collection[7]);
	});
});

describe('Circular navigation with large offset', () => {
	test('Give the third item with offset 71 to get the fifth item of 10', () => {
		expect(getItemByOffset(collection, 2, 73)).toBe(collection[5]);
	});
	test('Give the third item with offset -71 to get the last item of 10', () => {
		expect(getItemByOffset(collection, 2, -73)).toBe(collection[9]);
	});
	test('Give the third item with offset 1000 to get the sixth item of 10', () => {
		expect(getItemByOffset(collection, 2, 1004)).toBe(collection[6]);
	});
	test('Give the third item with offset -1000 to get the second item of 10', () => {
		expect(getItemByOffset(collection, 2, -1004)).toBe(collection[8]);
	});
});
