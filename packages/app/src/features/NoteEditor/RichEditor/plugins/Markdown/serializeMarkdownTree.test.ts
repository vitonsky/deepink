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

	test('Empty paragraph is considered as additional empty line', () => {
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
		).toBe('Hello\n\nWorld\n');
	});

	test('3 empty paragraphs is considered as 3 additional empty lines', () => {
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
		).toBe('Hello\n\n\n\nWorld\n');
	});

	test('Quote with 3 empty paragraphs must contain 3 empty lines', () => {
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
		).toBe('> Hello\n>\n>\n>\n> World\n');
	});

	test('Nested quote with 3 empty paragraphs must contain 3 empty lines', () => {
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
		).toBe('> Hello\n>\n>\n>\n> > Hello\n> >\n> >\n> >\n> > World\n');
	});
});
