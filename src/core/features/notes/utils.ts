import { INoteContent } from '@core/features/notes/index';

export const getNoteTitle = (note: INoteContent) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';
