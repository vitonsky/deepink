import { TagItem } from '@features/MainScreen/TagsPanel/TagsList';

import { sortTagsLexicographically } from './tags';

describe('Tags sorting', () => {
	test('Lexicographical sorting', () => {
		expect(
			(
				[
					{ id: 'foo', content: 'foo' },
					{ id: 'bar', content: 'bar' },
					{ id: 'baz', content: 'baz' },
				] as TagItem[]
			).sort(sortTagsLexicographically),
		).toEqual(
			['bar', 'baz', 'foo'].map((text) =>
				expect.objectContaining({ content: text }),
			),
		);

		expect(
			(
				[
					{ id: 'foo', content: 'foo' },
					{ id: 'bar', content: 'bar' },
					{ id: 'baz', content: 'baz' },
					{ id: 'baz', content: 'baz' },
				] as TagItem[]
			).sort(sortTagsLexicographically),
		).toEqual(
			['bar', 'baz', 'baz', 'foo'].map((text) =>
				expect.objectContaining({ content: text }),
			),
		);
	});
});
