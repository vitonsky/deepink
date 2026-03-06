import { INoteContent } from '@core/features/notes';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const getNoteMarkdownLinkTitle = (content: INoteContent, maxLength = 50) => {
	// Use first non-empty value or fallback
	const raw = content.title.trim() || content.text.trim() || 'Untitled';
	const truncated = raw.slice(0, maxLength).trim();

	return truncated.replace(mdCharsForEscapeRegEx, '\\$1');
};
