import { INote, INoteContent, NoteId } from '..';

export type NoteMeta = {
	isSnapshotsDisabled: boolean;
	isVisible: boolean;
	isDeleted: boolean;
};

export type NoteSortField = 'id' | 'createdAt' | 'updatedAt';

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

	/**
	 * Filters by note meta info
	 */
	meta?: Partial<NoteMeta>;

	search?: {
		text: string;
	};

	/**
	 * Sorting options
	 */
	sort?: {
		by: NoteSortField;
		order?: 'desc' | 'asc';
	};

	/**
	 * Filters notes by bookmarked
	 */
	bookmarks?: boolean;
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
	getLength(query?: NotesControllerFetchOptions): Promise<number>;

	/**
	 * Primary method to get notes filtered by parameters
	 */
	get(options?: NotesControllerFetchOptions): Promise<INote[]>;

	/**
	 * Create note and return unique id of new note
	 */
	add(note: INoteContent, meta?: Partial<NoteMeta>): Promise<NoteId>;

	/**
	 * Update note by unique id
	 */
	update(id: NoteId, updatedNote: INoteContent): Promise<void>;

	/**
	 * Update note meta information
	 */
	updateMeta(ids: NoteId[], meta: Partial<NoteMeta>): Promise<void>;

	/**
	 * Deletes all notes with specified ids
	 */
	delete(ids: NoteId[]): Promise<void>;
}
