import { Paragraph } from 'mdast';
import { u } from 'unist-builder';

import { serializeMarkdownTree } from './markdownParser';

describe('AST serialization', () => {
	test('2 paragraphs have 1 empty line', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe('Hello\n\nWorld\n');
	});

	test('Empty paragraph is considered as additional empty line + 2 lines around', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe(`Hello${'\n'.repeat(3)}\nWorld\n`);
	});

	test('3 empty paragraphs must be serialized as 5 empty lines', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe(`Hello${'\n'.repeat(5)}\nWorld\n`);
	});

	test('Quote with 3 empty paragraphs must contain 5 empty lines', () => {
		expect(
			serializeMarkdownTree({
				type: 'root',
				children: [
					{
						type: 'blockquote',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'Hello',
									},
								],
							},
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'World',
									},
								],
							},
						],
					},
				],
			}),
		).toBe(`> Hello${`\n>`.repeat(5)}\n> World\n`);
	});

	test('Nested quote with 3 empty paragraphs must contain 5 empty lines', () => {
		expect(
			serializeMarkdownTree({
				type: 'root',
				children: [
					{
						type: 'blockquote',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'Hello',
									},
								],
							},
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							{
								type: 'blockquote',
								children: [
									{
										type: 'paragraph',
										children: [
											{
												type: 'text',
												value: 'Hello',
											},
										],
									},
									u('paragraph', { children: [] }),
									u('paragraph', { children: [] }),
									u('paragraph', { children: [] }),
									{
										type: 'paragraph',
										children: [
											{
												type: 'text',
												value: 'World',
											},
										],
									},
								],
							},
						],
					},
				],
			}),
		).toBe(`> Hello${`\n>`.repeat(5)}\n> > Hello${'\n> >'.repeat(5)}\n> > World\n`);
	});
});
