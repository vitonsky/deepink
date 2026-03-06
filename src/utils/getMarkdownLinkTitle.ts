import { INoteContent } from '@core/features/notes';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const getMarkdownTitle = (content: INoteContent, maxLength = 50) => {
	const rawTitle = content.title || content.text || 'Untitled';

	return rawTitle.slice(0, maxLength).trim().replace(mdCharsForEscapeRegEx, '\\$1');
};
