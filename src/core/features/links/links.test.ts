import {
	findLinksInText,
	formatNoteLink,
	formatResourceLink,
	getAppResourceDataInUrl,
} from '.';

test('formatters and parsers behavior are consistent', () => {
	const link = formatNoteLink('foo-bar');
	// eslint-disable-next-line spellcheck/spell-checker
	const link2 = formatResourceLink('baz-qux');

	const exampleText = `Example text with links. See a link ${link} on note and link ${link2} on resource`;

	const linksInText = findLinksInText(exampleText);
	expect(linksInText).toMatchSnapshot();

	const parsedLinks = linksInText.map((link) => getAppResourceDataInUrl(link.url));
	expect(parsedLinks).toEqual([
		{
			id: 'foo-bar',
			type: 'note',
		},
		{
			// eslint-disable-next-line spellcheck/spell-checker
			id: 'baz-qux',
			type: 'resource',
		},
	]);
});
