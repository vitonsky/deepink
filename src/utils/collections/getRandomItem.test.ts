import { getRandomItem } from './getRandomItem';

const collection = ['Apple', 'Banana', 'Watermelon', 'Carrot', 'Eggplant'];

test('Returns undefined for empty collection', () => {
	expect(getRandomItem([])).toBe(undefined);
});

test('Returns random value', () => {
	for (let i = 0; i < 5; i++) {
		expect(getRandomItem(collection)).toBeTypeOf('string');
	}
});

test('Returns the value for collection with one item', () => {
	const smallCollection = ['Apple'];
	expect(getRandomItem(smallCollection)).toBe(smallCollection[0]);
});

test('Returns the first and last items from the collection', () => {
	vi.spyOn(Math, 'random')
		.mockImplementationOnce(() => 0)
		.mockImplementationOnce(() => 0.9);

	expect(getRandomItem(collection)).toBe(collection[0]);

	expect(getRandomItem(collection)).toBe(collection[collection.length - 1]);
});
