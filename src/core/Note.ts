/**
 * Primary note data
 */
export type INoteData = {
	title: string;
	text: string;
};

/**
 * Full note data, include meta data
 */
export type INote = {
	id: string;
	createdTimestamp?: number;
	updatedTimestamp?: number;
	data: INoteData;
};
