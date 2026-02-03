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
	 * Deletes a note.
	 * Behavior depends on the permanent flag: true move the note to the bin, false removes it permanently
	 */
	DELETE_NOTE = 'DELETE_NOTE',

	/**
	 * Restore a note from the Bin
	 */
	RESTORE_NOTE_FROM_BIN = 'restoreNoteFromBin',

	/**
	 * Toggle the archive status of the note
	 */
	TOGGLE_NOTE_ARCHIVE = 'TOGGLE_NOTE_ARCHIVE',

	/**
	 * Toggle the bookmark status of the note
	 */
	TOGGLE_NOTE_BOOKMARK = 'TOGGLE_NOTE_BOOKMARK',

	/**
	 * Toggle the history view for the note
	 */
	TOGGLE_NOTE_HISTORY = 'TOGGLE_NOTE_HISTORY',

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

	/**
	 * Triggered when a keyboard shortcut is pressed
	 */
	SHORTCUTS_PRESSED = 'SHORTCUTS_PRESSED',
}

type CommandsWithPayload = {
	[GLOBAL_COMMANDS.DELETE_NOTE]: { id: string; permanent: boolean };
	[GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN]: { id: string };

	[GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE]: { id: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK]: { id: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY]: { id: string };

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
