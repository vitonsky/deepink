import { INote, INoteData, NoteId } from "../Note";

export type NotesRegistryFetchOptions = {};

// TODO: add method `delete`
/**
 * Notes controller interface
 */
export interface INotesRegistry {
	/**
	 * Get entry by ID
	 */
	getById(id: NoteId): Promise<INote | null>;

	// TODO: add options to set limit and offset
	/**
	 * Primary method to get notes filtered by parameters
	 */
	get(options?: NotesRegistryFetchOptions): Promise<INote[]>;

	/**
	 * Create note and return unique id of new note
	 */
	add(note: INoteData): Promise<NoteId>;

	/**
	 * Update note by unique id
	 */
	update(id: NoteId, updatedNote: INoteData): Promise<void>;
}