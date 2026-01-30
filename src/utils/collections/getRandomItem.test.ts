import { getRandomItem } from './getRandomItem';

beforeEach(() => {
	vi.clearAllMocks();
});

const collection = ['Apple', 'Banana', 'Watermelon', 'Carrot', 'Eggplant'];

test('Returns undefined for empty collection', () => {
	expect(getRandomItem([])).toBe(undefined);
});

test('Returns the value for collection with one item', () => {
	const smallCollection = ['Apple'];
	expect(getRandomItem(smallCollection)).toBe(smallCollection[0]);
});

test('Returns the first and last items from the collection', () => {
	vi.spyOn(Math, 'random')
		.mockReturnValueOnce(0)
		.mockReturnValueOnce(0.1)
		.mockReturnValueOnce(0.8)
		.mockReturnValueOnce(0.9);

	expect(getRandomItem(collection)).toBe(collection[0]);
	expect(getRandomItem(collection)).toBe(collection[0]);

	expect(getRandomItem(collection)).toBe(collection[collection.length - 1]);
	expect(getRandomItem(collection)).toBe(collection[collection.length - 1]);
});
