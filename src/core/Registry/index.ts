import { INote, INoteData, NoteId } from "../Note";

// TODO: eliminate "Note" word from names
// TODO: add method `delete`
/**
 * Notes controller interface
 */
export interface INotesRegistry {
	// TODO: add options to set limit and offset
	/**
	 * Primary method to get notes filtered by parameters
	 */
	getNotes(): Promise<INote[]>;

	/**
	 * Create note and return unique id of new note
	 */
	addNote(note: INoteData): Promise<NoteId>;

	/**
	 * Update note by unique id
	 */
	updateNote(id: NoteId, updatedNote: INoteData): Promise<void>;
}