import { NoteMeta } from './controller';

/**
 * Note content
 */
export type INoteContent = {
	title: string;
	text: string;
};

export type NoteId = string;

/**
 * Full note data, include meta data
 */
export type INote = {
	id: NoteId;
	createdTimestamp?: number;
	updatedTimestamp?: number;
	deletedAt?: number;
	content: INoteContent;
} & Partial<NoteMeta>;
