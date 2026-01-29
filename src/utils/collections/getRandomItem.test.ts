import { getRandomItem } from './getRandomItem';

const collection = ['Apple', 'Banana', 'Watermelon', 'Carrot', 'Eggplant'];

test('Returns undefined for empty collection', () => {
	expect(getRandomItem([])).toBe(undefined);
});

test('Returns random value', () => {
	expect(getRandomItem(collection)).toBeTypeOf('string');
});

test('Returns the value for collection with one item', () => {
	expect(getRandomItem(collection.slice(0, 1))).toBe(collection[0]);
});

test('Can return the first item', () => {
	vi.spyOn(Math, 'random').mockReturnValue(0);
	expect(getRandomItem(collection)).toBe(collection[0]);
});

test('Can return the last item', () => {
	vi.spyOn(Math, 'random').mockReturnValue(0.9);
	expect(getRandomItem(collection)).toBe(collection[collection.length - 1]);
});
