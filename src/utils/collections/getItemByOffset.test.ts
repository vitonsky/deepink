import { getItemByOffset } from '@utils/collections/getItemByOffset';

const collection = Array.from({ length: 10 }, (_, i) => `item${i}`);

test('Do not navigate when collection has fewer than 2 items, returning null', () => {
	expect(getItemByOffset([], 0, 1)).toBe(null);
	expect(getItemByOffset([1], 0, 1)).toBe(null);
	expect(getItemByOffset([1, 2], 0, 1)).toBe(2);
});
test('Returns null for an index outside the collection', () => {
	expect(getItemByOffset([1, 2, 3], 67, 1)).toBe(null);
});

describe('Receive next item (positive offset)', () => {
	test('Navigate to next from the first item with offset 1, receiving the second item', () => {
		expect(getItemByOffset(collection, 0, 1)).toBe(collection[1]);
	});
	test('Navigate to next from the second item with offset 1, receiving the 3rd item', () => {
		expect(getItemByOffset(collection, 1, 1)).toBe(collection[2]);
	});
	test('Navigate to next from the third item with offset 1, receiving the 4th item', () => {
		expect(getItemByOffset(collection, 2, 1)).toBe(collection[3]);
	});
	test('Navigate to next from the sixth item with offset 1, receiving the 7th item', () => {
		expect(getItemByOffset(collection, 5, 1)).toBe(collection[6]);
	});
});

describe('Receive previous item (negative offset)', () => {
	test('Navigate to previous from the 10th item with offset -1, receiving the 9th item', () => {
		expect(getItemByOffset(collection, 9, -1)).toBe(collection[8]);
	});
	test('Navigate to previous from the 9th item with offset -1, receiving the 8th item', () => {
		expect(getItemByOffset(collection, 8, -1)).toBe(collection[7]);
	});
	test('Navigate to previous from the 6th item with offset -1, receiving the 5th item', () => {
		expect(getItemByOffset(collection, 5, -1)).toBe(collection[4]);
	});
});

describe('Circular navigation', () => {
	test('Navigate forward from end to start with offset 1, wrapping to the first item', () => {
		expect(getItemByOffset(collection, 9, 1)).toBe(collection[0]);
	});
	test('Navigate forward from end to start with offset 3, wrapping to the 3rd item', () => {
		expect(getItemByOffset(collection, 9, 3)).toBe(collection[2]);
	});
	test('Navigate backward from start to end with offset -1, wrapping to the last item', () => {
		expect(getItemByOffset(collection, 0, -1)).toBe(collection[9]);
	});
	test('Navigate backward from start to end with offset -3, wrapping to the 8th item', () => {
		expect(getItemByOffset(collection, 0, -3)).toBe(collection[7]);
	});
});

describe('Circular navigation with large offset', () => {
	test('Navigate from the 3rd item to the next with offset 73, wrapping to the 6th item', () => {
		expect(getItemByOffset(collection, 2, 73)).toBe(collection[5]);
	});
	test('Navigate backward from the 3rd item with offset -73, wrapping to the last item', () => {
		expect(getItemByOffset(collection, 2, -73)).toBe(collection[9]);
	});
	test('Navigate forward from the 3rd item with offset 1004, wrapping to the 7th item', () => {
		expect(getItemByOffset(collection, 2, 1004)).toBe(collection[6]);
	});
	test('Navigate backward from the 3rd item with offset -1004, wrapping to the 9th item', () => {
		expect(getItemByOffset(collection, 2, -1004)).toBe(collection[8]);
	});
});
