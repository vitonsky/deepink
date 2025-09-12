export enum GLOBAL_COMMANDS {
	/**
	 * Create and open a new note
	 */
	CREATE_NOTE = 'createNote',

	/**
	 * Close the current note
	 */
	CLOSE_NOTE = 'closeNote',

	/**
	 * Reopen the last closed note
	 */
	RESTORE_CLOSED_NOTE = 'restoreNote',

	/**
	 * Move to the note on the left
	 */
	NAVIGATE_NOTE_LEFT = 'openPreviouslyNote',

	/**
	 * Move to the note on the right
	 */
	NAVIGATE_NOTE_RIGHT = 'openNextNote',

	/**
	 * Lock the user profile
	 */
	LOCK_PROFILE = 'lockProfile',
}
