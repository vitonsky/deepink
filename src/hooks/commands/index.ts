import { Shortcuts } from './shortcuts';

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
	 * Switch focus to the next open note
	 */
	FOCUS_NEXT_NOTE = 'focusNextNote',

	/**
	 * Switch focus to the previous open note
	 */
	FOCUS_PREVIOUS_NOTE = 'focusPreviousNote',

	/**
	 * Deletes a note.
	 * Behavior depends on the 'permanently' flag: false move the note to the bin, true removes it permanently
	 */
	DELETE_NOTE = 'DELETE_NOTE',

	/**
	 * Restore a note from the Bin
	 */
	RESTORE_NOTE_FROM_BIN = 'RESTORE_NOTE_FROM_BIN',

	/**
	 * Toggle the archive status of the note
	 */
	TOGGLE_NOTE_ARCHIVE = 'TOGGLE_NOTE_ARCHIVE',

	/**
	 * Toggle the bookmark status of the note
	 */
	TOGGLE_NOTE_BOOKMARK = 'TOGGLE_NOTE_BOOKMARK',

	/**
	 * Open and close the history for a note
	 */
	TOGGLE_NOTE_HISTORY_PANEL = 'TOGGLE_NOTE_HISTORY_PANEL',

	/**
	 * Export a note
	 */
	EXPORT_NOTE = 'EXPORT_NOTE',

	/**
	 * Copy the Markdown link for the note
	 */
	COPY_NOTE_MARKDOWN_LINK = 'COPY_NOTE_MARKDOWN_LINK',

	/**
	 * Creates a copy of an existing note
	 */
	DUPLICATE_NOTE = 'DUPLICATE_NOTE',

	/**
	 * Open global settings window
	 */
	OPEN_GLOBAL_SETTINGS = 'OPEN_GLOBAL_SETTINGS',

	/**
	 * Synchronize the database
	 */
	SYNC_DATABASE = 'SYNC_DATABASE',

	/**
	 * Lock the currently active user profile
	 */
	LOCK_CURRENT_PROFILE = 'lockCurrentProfile',

	/**
	 * Focus the search input field
	 */
	FOCUS_SEARCH = 'FOCUS_SEARCH',

	/**
	 * Indicates a keyboard shortcut was pressed
	 */
	SHORTCUTS_PRESSED = 'SHORTCUTS_PRESSED',
}

type CommandsWithPayload = {
	[GLOBAL_COMMANDS.DELETE_NOTE]: { noteId: string; permanently: boolean };
	[GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN]: { noteId: string };

	[GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE]: { noteId: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK]: { noteId: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL]: { noteId: string };

	[GLOBAL_COMMANDS.EXPORT_NOTE]: { noteId: string };
	[GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK]: { noteId: string };
	[GLOBAL_COMMANDS.DUPLICATE_NOTE]: { noteId: string };

	[GLOBAL_COMMANDS.SHORTCUTS_PRESSED]: Shortcuts;
};

export type CommandPayloadsMap = {
	[K in GLOBAL_COMMANDS]: K extends keyof CommandsWithPayload
		? CommandsWithPayload[K]
		: void;
};
