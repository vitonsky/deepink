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
	 * Move a note to the Bin
	 */
	DELETE_NOTE_TO_BIN = 'deleteNoteToBin',

	/**
	 * Restore a note from the Bin
	 */
	RESTORE_NOTE_FROM_BIN = 'restoreNoteFromBin',

	/**
	 * Permanently delete a note
	 */
	DELETE_NOTE_PERMANENTLY = 'deleteNotePermanently',

	/**
	 * Toggle the archive status of the current note
	 */
	TOGGLE_CURRENT_NOTE_ARCHIVE = 'toggleCurrentNoteArchive',

	/**
	 * Toggle the bookmark status of the current note
	 */
	TOGGLE_CURRENT_NOTE_BOOKMARK = 'toggleCurrentNoteBookmark',

	/**
	 * Open the history for the current note
	 */
	OPEN_CURRENT_NOTE_HISTORY = 'openCurrentNoteHistory',

	/**
	 * Export a note
	 */
	EXPORT_NOTE = 'exportNote',

	/**
	 * Copy the Markdown link for the current note
	 */
	COPY_NOTE_MARKDOWN_LINK = 'copyNoteMarkdownLink',

	/**
	 * Switch focus to the next open note
	 */
	FOCUS_NEXT_NOTE = 'focusNextNote',

	/**
	 * Switch focus to the previous open note
	 */
	FOCUS_PREVIOUS_NOTE = 'focusPreviousNote',

	/**
	 * Open global settings window
	 */
	OPEN_GLOBAL_SETTINGS = 'OPEN_GLOBAL_SETTINGS',

	/**
	 * Synchronize the changes with the database
	 */
	SYNC_DATABASE = 'syncDataBase',

	/**
	 * Lock the currently active user profile
	 */
	LOCK_CURRENT_PROFILE = 'lockCurrentProfile',

	/**
	 * Focus the search input field
	 */
	FOCUS_SEARCH = 'FOCUS_SEARCH',

	SHORTCUTS_PRESSED = 'SHORTCUTS_PRESSED',
}

type CommandsWithPayload = {
	[GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN]: { id: string };
	[GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY]: { id: string };
	[GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN]: { id: string };

	[GLOBAL_COMMANDS.EXPORT_NOTE]: { id: string };
	[GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK]: { id: string };

	[GLOBAL_COMMANDS.SHORTCUTS_PRESSED]: Shortcuts;
};

export type CommandPayloadsMap = {
	[K in GLOBAL_COMMANDS]: K extends keyof CommandsWithPayload
		? CommandsWithPayload[K]
		: void;
};

export const SHORTCUT_NAMES = {
	[GLOBAL_COMMANDS.CREATE_NOTE]: 'Create note',
	[GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE]: 'Close current note',
	[GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE]: 'Restore closed note',
	[GLOBAL_COMMANDS.FOCUS_NEXT_NOTE]: 'Go to next tab',
	[GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE]: 'Go to previous tab',
	[GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE]: 'Lock vault',
	[GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS]: 'Open preferences',
};
