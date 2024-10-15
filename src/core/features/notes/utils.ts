import { INoteContent } from '@core/features/notes/index';

export const getNoteTitle = (note: INoteContent) => {
	const title = (note.title || note.text).trim().slice(0, 25).trim();
	return title || 'Empty note';
};
