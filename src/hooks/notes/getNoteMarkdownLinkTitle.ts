import { INoteContent } from '@core/features/notes';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const getNoteMarkdownLinkTitle = (content: INoteContent, createdAt?: number) => {
	// Use first non-empty value or fallback
	const raw =
		content.title.trim() ||
		content.text.trim() ||
		new Date(createdAt || Date.now()).toDateString();
	const truncated = raw.slice(0, 50).trim();

	return truncated.replace(mdCharsForEscapeRegEx, '\\$1');
};
