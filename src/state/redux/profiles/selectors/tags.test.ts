/* eslint-disable @cspell/spellchecker */

import { sortTagsLexicographically, TagNode } from './tags';

describe('Tags sorting', () => {
	describe('Lexicographical sorting', () => {
		test('A->Z order', () => {
			expect(
				(
					[
						{ id: 'foo', name: 'foo' },
						{ id: 'bar', name: 'bar' },
						{ id: 'baz', name: 'baz' },
					] as TagNode[]
				).sort(sortTagsLexicographically),
			).toEqual(
				['bar', 'baz', 'foo'].map((text) =>
					expect.objectContaining({ name: text }),
				),
			);
		});

		test('A->Z order for other locales', () => {
			expect(
				(
					[
						{ id: 'foo', name: 'Банан' },
						{ id: 'bar', name: 'Яблоко' },
						{ id: 'baz', name: 'Арбуз' },
					] as TagNode[]
				).sort(sortTagsLexicographically),
			).toEqual(
				['Арбуз', 'Банан', 'Яблоко'].map((text) =>
					expect.objectContaining({ name: text }),
				),
			);
		});

		test('Order is determined', () => {
			const tags = [
				{ id: 'foo', name: 'foo' },
				{ id: 'bar', name: 'bar' },
				{ id: 'baz1', name: 'baz' },
				{ id: 'baz2', name: 'baz' },
			] as TagNode[];

			for (let i = 1; i <= 10; i++) {
				const shuffledArray = tags
					.slice()
					.sort(() => (Math.random() > 0.5 ? 1 : -1));
				expect(shuffledArray.sort(sortTagsLexicographically)).toEqual(
					['bar', 'baz1', 'baz2', 'foo'].map((text) =>
						expect.objectContaining({ id: text }),
					),
				);
			}
		});
	});
});
