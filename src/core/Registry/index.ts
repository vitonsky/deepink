import { INote, INoteData, NoteId } from "../Note";

export type NotesRegistryFetchOptions = {
	/**
	 * Limit entries
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
};

// TODO: add method `delete`
/**
 * Notes controller interface
 */
export interface INotesRegistry {
	/**
	 * Get entry by ID
	 */
	getById(id: NoteId): Promise<INote | null>;

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