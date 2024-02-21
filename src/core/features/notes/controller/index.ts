import { INote, INoteContent, NoteId } from '..';

export type NotesControllerFetchOptions = {
	/**
	 * Limit notes
	 *
	 * @default 100
	 */
	limit?: number;

	/**
	 * Page number start of 1
	 *
	 * Implementations must thrown error for values less than 1
	 *
	 * @default 1
	 */
	page?: number;

	/**
	 * Filter notes by tags
	 */
	tags?: string[];
};

/**
 * Notes controller interface
 */
export interface INotesController {
	/**
	 * Get note by ID
	 */
	getById(id: NoteId): Promise<INote | null>;

	/**
	 * Get number of notes
	 */
	getLength(): Promise<number>;

	/**
	 * Primary method to get notes filtered by parameters
	 */
	get(options?: NotesControllerFetchOptions): Promise<INote[]>;

	/**
	 * Create note and return unique id of new note
	 */
	add(note: INoteContent): Promise<NoteId>;

	/**
	 * Update note by unique id
	 */
	update(id: NoteId, updatedNote: INoteContent): Promise<void>;

	/**
	 * Deletes all notes with specified ids
	 */
	delete(ids: NoteId[]): Promise<void>;
}
