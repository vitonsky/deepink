export enum GLOBAL_COMMANDS {
	/**
	 * Create and open a new note
	 */
	CREATE_NOTE = 'createNote',

	/**
	 * Close the current note
	 */
	CLOSE_CURRENT_NOTE = 'closeCurrentNote',

	/**
	 * Reopen the last closed note
	 */
	RESTORE_CLOSED_NOTE = 'restoreClosedNote',

	/**
	 * Move a note to the Bin
	 */
	DELETE_NOTE_TO_BIN = 'deleteNoteToBin',

	/**
	 * Permanently delete a note
	 */
	DELETE_NOTE_PERMANENTLY = 'deleteNotePermanently',

	/**
	 * Restore a note from the Bin
	 */
	RESTORE_NOTE_FROM_BIN = 'restoreNoteFromBin',

	/**
	 * Toggle archive state for current note
	 */
	TOGGLE_CURRENT_NOTE_ARCHIVE = 'toggleCurrentNoteArchive',

	/**
	 * Toggle bookmark state for current note
	 */
	TOGGLE_CURRENT_NOTE_BOOKMARK = 'toggleCurrentNoteBookmark',

	/**
	 * Switch focus to the next open note
	 */
	FOCUS_NEXT_NOTE = 'focusNextNote',

	/**
	 * Switch focus to the previous open note
	 */
	FOCUS_PREVIOUS_NOTE = 'focusPreviousNote',

	/**
	 * Lock the currently active user profile
	 */
	LOCK_CURRENT_PROFILE = 'lockCurrentProfile',

	/**
	 * Open the history for the current note
	 */
	OPEN_NOTE_HISTORY = 'openNoteHistory',
}

// In the future, we can define a type for the payload like this:
// type CommandPayloads = { [GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE]: { profileId: string }; }
type CommandsWithPayload = {
	[GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN]: { id: string };
	[GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY]: { id: string };
	[GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN]: { id: string };
};

export type CommandPayloadsMap = {
	[K in GLOBAL_COMMANDS]: K extends keyof CommandsWithPayload
		? CommandsWithPayload[K]
		: void;
};
