import { getItemByOffset } from '@utils/collections/getItemByOffset';

const collection = Array.from({ length: 10 }, (_, i) => `item${i}`);

test('Returns null if the collection has fewer than 2 items', () => {
	expect(getItemByOffset([], 0, 1)).toBe(null);
	expect(getItemByOffset([1], 0, 1)).toBe(null);
	expect(getItemByOffset([1, 2], 0, 1)).toBe(2);
});
test('Returns null for an index outside the collection', () => {
	expect(getItemByOffset([1, 2, 3], 67, 1)).toBe(null);
});

describe('Receive next item (positive offset)', () => {
	test('Navigates to the next item from the 1st, receiving the 2nd item', () => {
		expect(getItemByOffset(collection, 0, 1)).toBe(collection[1]);
	});
	test('Navigates to the next item from the 2nd, receiving the 3rd item', () => {
		expect(getItemByOffset(collection, 1, 1)).toBe(collection[2]);
	});
	test('Navigates to the next item from the 3rd, receiving the 4th item', () => {
		expect(getItemByOffset(collection, 2, 1)).toBe(collection[3]);
	});
	test('Navigates to the next item from the 6th, receiving the 7th item', () => {
		expect(getItemByOffset(collection, 5, 1)).toBe(collection[6]);
	});
});

describe('Receive previous item (negative offset)', () => {
	test('Navigates to the previous item from the 10th, receiving the 9th item', () => {
		expect(getItemByOffset(collection, 9, -1)).toBe(collection[8]);
	});
	test('Navigates to the previous item from the 9th, receiving the 8th item', () => {
		expect(getItemByOffset(collection, 8, -1)).toBe(collection[7]);
	});
	test('Navigates to the previous item from the 6th, receiving the 5th item', () => {
		expect(getItemByOffset(collection, 5, -1)).toBe(collection[4]);
	});
});

describe('Circular navigation', () => {
	test('Navigates forward from the last to the first with offset 1, wrapping to the 1st item of 10', () => {
		expect(getItemByOffset(collection, 9, 1)).toBe(collection[0]);
	});
	test('Navigates forward from the last item with offset 3, wrapping to the 3rd item of 10', () => {
		expect(getItemByOffset(collection, 9, 3)).toBe(collection[2]);
	});
	test('Navigates backward from the first to the last with offset -1, wrapping to the 10th item of 10', () => {
		expect(getItemByOffset(collection, 0, -1)).toBe(collection[9]);
	});
	test('Navigates backward from the first item with offset -3, wrapping to the 8th item of 10', () => {
		expect(getItemByOffset(collection, 0, -3)).toBe(collection[7]);
	});
});

describe('Circular navigation with large offset', () => {
	test('Navigates forward from the 3rd item with offset 73, wrapping to the 6th item of 10', () => {
		expect(getItemByOffset(collection, 2, 73)).toBe(collection[5]);
	});
	test('Navigates backward from the 3rd item with offset -73, wrapping to the 10th item of 10', () => {
		expect(getItemByOffset(collection, 2, -73)).toBe(collection[9]);
	});
	test('Navigates forward from the 3rd item with offset 1004, wrapping to the 7th item of 10', () => {
		expect(getItemByOffset(collection, 2, 1004)).toBe(collection[6]);
	});
	test('Navigates backward from the 3rd item with offset -1004, wrapping to the 9th item of 10', () => {
		expect(getItemByOffset(collection, 2, -1004)).toBe(collection[8]);
	});
});
