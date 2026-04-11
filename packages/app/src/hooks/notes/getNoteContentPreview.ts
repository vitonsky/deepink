import { INoteContent } from '@core/features/notes';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const getNoteContentPreview = (content: INoteContent) => {
	// Use the first non-empty value or return null
	const raw = content.title.trim() || content.text.trim();
	if (raw.length === 0) return null;

	const truncated = raw.slice(0, 50).trim();
	return truncated.replace(mdCharsForEscapeRegEx, '\\$1');
};
