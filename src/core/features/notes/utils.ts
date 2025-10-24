import { INoteContent } from '@core/features/notes/index';

export const getNoteTitle = (note: INoteContent, limit?: number) => {
	let title = (note.title || note.text).trim();
	if (limit) {
		title = title.slice(0, limit).trim();
	}

	return title || 'Empty note';
};
