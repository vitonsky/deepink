/**
 * @vitest-environment jsdom
 */

import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	$serializeAsMarkdownAST,
	markdownProcessor,
	parseMarkdownToAST,
} from '../markdownParser';
import {
	detailsWithSummary,
	fewParagraphs,
	formattedLine,
	formattingInList,
	formattingInQuote,
	formattingInTable,
	mixedList,
	nestedQuote,
	postWithHeaders,
	richFormatting,
	simpleCode,
	simpleFormatting,
	simpleQuote,
	simpleTable,
	unsupportedFeatures,
} from './markdown-samples';
import {
	createLexicalEditorInstance,
	normalizeMarkdownTree,
	updateEditorState,
} from './utils';

test('Markdown parser round-trips', () => {
	const ast = parseMarkdownToAST(richFormatting);
	const out = markdownProcessor.stringify(ast);

	expect(normalizeMarkdownTree(parseMarkdownToAST(out))).toEqual(
		normalizeMarkdownTree(ast),
	);
});

type MarkdownTestCase = {
	title: string;
	markdown: string;
	inconsistentAST?: boolean;
};

const normalizedMarkdownCases: MarkdownTestCase[] = [
	{
		title: 'Bold node inside bold node',
		markdown: '**foo __bar__ baz**',
		inconsistentAST: true,
	},
	{
		title: 'Few paragraphs',
		markdown: fewParagraphs,
	},
	{
		title: 'Inline code',
		markdown: 'Text with `code`',
	},
	{
		title: 'Inline code with formatting',
		markdown: 'Text with ***~~`formatted code`~~***',
	},
	{
		title: 'Rich formatting',
		markdown: richFormatting,
	},
	{
		title: 'Plain list',
		markdown: '- foo\n  - bar\n  - baz',
	},
	{
		title: 'Simple formatting',
		markdown: simpleFormatting,
	},
	{
		title: 'Header with formatting',
		markdown:
			'### *All header is italic, **something bold**, ~~strikethrough~~, `inline code`*',
	},
	{
		title: 'List with formatting',
		markdown: formattingInList,
	},
	{
		title: 'Quote with formatting',
		markdown: formattingInQuote,
	},
	{
		title: 'Table with formatting',
		markdown: formattingInTable,
	},
	{
		title: 'List item with inline elements',
		markdown: '- foo [bar](...) baz',
	},
	{
		title: 'List item with inline elements and nested list',
		markdown: '- item 1 [foo](...) bar\n  - item 1-2\n  - item 2-2',
	},
	{
		title: 'Numbered list',
		markdown: '1. foo\n  2. bar\n  3. baz',
	},
	{
		title: 'Check list with no checked items',
		markdown: '- [ ] foo\n  - [ ] bar\n  - [ ] baz',
	},
	{
		title: 'Check list with one checked item',
		markdown: '- [ ] foo\n  - [x] bar\n  - [ ] baz',
	},
	{
		title: 'Check list with all checked items',
		markdown: '- [x] foo\n  - [x] bar\n  - [x] baz',
	},
	{
		title: 'Mixed list',
		markdown: mixedList,
	},
	{
		title: 'Simple post with headers',
		markdown: postWithHeaders,
	},
	{
		title: 'Text with few empty lines',
		markdown: 'foo\n\n\nbar',
	},
	{
		title: 'Simple code',
		markdown: simpleCode,
	},
	{
		title: 'Formatted line',
		markdown: formattedLine,
	},
	{
		title: 'Links',
		markdown: `Some [link](https://url "Title") and [another link](proto://url)`,
	},
	{
		title: 'Image',
		// TODO: support for image title
		markdown: `![Alt text](https://url)`,
	},
	{
		title: 'Image wrapped by link',
		// TODO: support for image title
		markdown: `[![Alt text](https://url)](proto://url2 "Link title")`,
	},
	{
		title: 'Simple quote',
		markdown: simpleQuote,
	},
	{
		title: 'Nested quote',
		markdown: nestedQuote,
	},
	{
		title: 'Simple table',
		markdown: simpleTable,
	},
	{
		title: 'Details with summary',
		markdown: detailsWithSummary,
		inconsistentAST: true,
	},
	{
		title: 'Unsupported features',
		markdown: unsupportedFeatures,
	},
];

describe('Normalized Markdown-Lexical-Markdown round-trips must yield consistent markdown text', () => {
	normalizedMarkdownCases.forEach(({ title, markdown: sourceText, inconsistentAST }) =>
		test(title, async () => {
			const { editor, destroy } = createLexicalEditorInstance();
			onTestFinished(destroy);

			await updateEditorState(editor, () => {
				$convertFromMarkdownString(sourceText);
			});

			// Skip AST equality check for cases where AST may be optimized
			// Even in that cases the source and output must be equal visually
			if (!inconsistentAST) {
				expect(
					editor.read(() => normalizeMarkdownTree($serializeAsMarkdownAST())),
					'Exact AST equality after roundtrip',
				).toMatchObject(normalizeMarkdownTree(parseMarkdownToAST(sourceText)));
			}

			const out = editor.read(() => $convertToMarkdownString());
			expect(out).toMatchSnapshot('Consistent markdown output');

			// Parse markdown
			await updateEditorState(editor, () => {
				$convertFromMarkdownString(out);
			});

			expect(
				editor.read(() => $convertToMarkdownString()),
				'Consistent markdown after roundtrips',
			).toBe(out);
		}),
	);
});

describe('Any Markdown-Lexical-Markdown round-trips must yield consistent markdown text after normalization', () => {
	const markdownCases: MarkdownTestCase[] = [
		...normalizedMarkdownCases,
		{
			title: '2 paragraph with one line gap',
			markdown: 'foo\n\nbar',
		},
		{
			title: '2 paragraph with two lines gap',
			markdown: 'foo\n\n\nbar',
		},
		{
			title: '2 paragraph with 3 lines gap',
			markdown: `foo${'\n'.repeat(3)}\nbar`,
		},
		{
			title: '2 paragraph with 10 lines gap',
			markdown: `foo${'\n'.repeat(10)}\nbar`,
		},
	];

	markdownCases.forEach(({ title, markdown: sourceText }) =>
		test(title, async () => {
			const { editor, destroy } = createLexicalEditorInstance();
			onTestFinished(destroy);

			const rounds = 10;
			expect.assertions(rounds - 1);

			let input = sourceText;
			const outputs: string[] = [];
			for (let round = 0; round < rounds; round++) {
				await updateEditorState(editor, () => {
					$convertFromMarkdownString(input);
				});

				const output = editor.read(() => $convertToMarkdownString());
				outputs.push(output);

				// Use output as input on next step
				input = output;

				if (round > 0) {
					expect(outputs[round], `Round #${round}`).toBe(outputs[round - 1]);
				}
			}
		}),
	);
});
