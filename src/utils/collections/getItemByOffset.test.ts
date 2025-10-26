import { getItemByOffset } from '@utils/collections/getItemByOffset';

const collection = Array.from({ length: 10 }, (_, i) => `item${i}`);

test('Returns null if the collection has fewer than 1 items', () => {
	expect(getItemByOffset([], 0, 1)).toBe(null);
	expect(getItemByOffset([1], 0, 1)).toBe(1);
	expect(getItemByOffset([1, 2], 0, 1)).toBe(2);
});

test('Returns null for an index outside the collection', () => {
	expect(getItemByOffset([1, 2, 3], 67, 1)).toBe(null);
});

test('Iterate collection forward by one element', () => {
	expect(getItemByOffset(collection, 0, 1)).toBe(collection[1]);
	expect(getItemByOffset(collection, 1, 1)).toBe(collection[2]);
	expect(getItemByOffset(collection, 2, 1)).toBe(collection[3]);
	expect(getItemByOffset(collection, 5, 1)).toBe(collection[6]);
});

test('Iterate collection back by one element', () => {
	expect(getItemByOffset(collection, 9, -1)).toBe(collection[8]);
	expect(getItemByOffset(collection, 8, -1)).toBe(collection[7]);
	expect(getItemByOffset(collection, 5, -1)).toBe(collection[4]);
});

test('Cycles forward through the collection, wrapping from end to start', () => {
	expect(getItemByOffset(collection, 9, 1)).toBe(collection[0]);
	expect(getItemByOffset(collection, 9, 3)).toBe(collection[2]);
	expect(getItemByOffset(collection, 9, 73)).toBe(collection[2]);
	expect(getItemByOffset(collection, 9, 1004)).toBe(collection[3]);
});

test('Cycles backward through the collection, wrapping from start to end', () => {
	expect(getItemByOffset(collection, 0, -1)).toBe(collection[9]);
	expect(getItemByOffset(collection, 0, -3)).toBe(collection[7]);
	expect(getItemByOffset(collection, 0, -73)).toBe(collection[7]);
	expect(getItemByOffset(collection, 0, -1004)).toBe(collection[6]);
});
