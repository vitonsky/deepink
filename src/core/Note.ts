/**
 * Primary note data
 */
export type INoteData = {
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
	data: INoteData;
};
