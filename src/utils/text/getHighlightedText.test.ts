import { findTextSegments } from './findTextSegments';
import { getHighlightedText } from './getHighlightedText';

test('Basic case', () => {
	const text = 'The quick brown fox jumps over the lazy dog';
	expect(
		getHighlightedText(text, findTextSegments(text, 'fox', { similarity: 0.7 })).map(
			(segment) => ({
				text: text.slice(segment.start, segment.end),
				highlight: segment.highlight,
			}),
		),
	).toStrictEqual([
		{
			text: 'The quick brown ',
			highlight: false,
		},
		{
			text: 'fox',
			highlight: true,
		},
		{
			text: ' jumps over the lazy dog',
			highlight: false,
		},
	]);
});

test('Multiple texts', () => {
	const text2 = 'The quick brown fox jumps over fox the lazy dog';
	expect(
		getHighlightedText(text2, findTextSegments(text2, 'fox'), { limit: 18 }).map(
			(segment) => ({
				text: text2.slice(segment.start, segment.end),
				highlight: segment.highlight,
			}),
		),
	).toStrictEqual([
		{
			text: 'quick brown ',
			highlight: false,
		},
		{
			text: 'fox',
			highlight: true,
		},
		{
			text: ' ju',
			highlight: false,
		},
	]);
});

test('Limit text size', () => {
	const text = 'The quick brown fox jumps over the lazy dog';
	expect(
		getHighlightedText(text, findTextSegments(text, 'fox', { similarity: 0.7 }), {
			limit: 25,
		}).map((segment) => ({
			text: text.slice(segment.start, segment.end),
			highlight: segment.highlight,
		})),
	).toStrictEqual([
		{
			text: 'The quick brown ',
			highlight: false,
		},
		{
			text: 'fox',
			highlight: true,
		},
		{
			text: ' jumps',
			highlight: false,
		},
	]);

	expect(
		getHighlightedText(text, findTextSegments(text, 'fox', { similarity: 0.7 }), {
			limit: 15,
		}).map((segment) => ({
			text: text.slice(segment.start, segment.end),
			highlight: segment.highlight,
		})),
	).toStrictEqual([
		{
			text: 'quick brown ',
			highlight: false,
		},
		{
			text: 'fox',
			highlight: true,
		},
	]);

	expect(
		getHighlightedText(text, findTextSegments(text, 'fox'), { limit: 2 }).map(
			(segment) => ({
				text: text.slice(segment.start, segment.end),
				highlight: segment.highlight,
			}),
		),
	).toStrictEqual([
		{
			text: 'fo',
			highlight: true,
		},
	]);

	expect(
		getHighlightedText(text, [], { limit: 10 }).map((segment) => ({
			text: text.slice(segment.start, segment.end),
			highlight: segment.highlight,
		})),
	).toStrictEqual([
		{
			text: 'The quick ',
			highlight: false,
		},
	]);
});
