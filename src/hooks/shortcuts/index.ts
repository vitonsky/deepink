export enum Shortcuts {
	CREATE_NOTE,
	CLOSE_CURRENT_NOTE,
	RESTORE_CLOSED_NOTE,
	FOCUS_NEXT_NOTE,
	FOCUS_PREVIOUS_NOTE,

	TOGGLE_CURRENT_NOTE_ARCHIVE,
	TOGGLE_CURRENT_NOTE_BOOKMARK,

	DELETE_CURRENT_NOTE,
	RESTORE_CURRENT_NOTE_FROM_BIN,

	TOGGLE_CURRENT_NOTE_HISTORY_PANEL,

	LOCK_CURRENT_PROFILE,
	SYNC_DATABASE,

	FOCUS_SEARCH,
	OPEN_GLOBAL_SETTINGS,
}

export const SHORTCUTS_MAP = {
	'CmdOrCtrl+N': Shortcuts.CREATE_NOTE,
	'CmdOrCtrl+W': Shortcuts.CLOSE_CURRENT_NOTE,
	'CmdOrCtrl+Shift+T': Shortcuts.RESTORE_CLOSED_NOTE,
	'CmdOrCtrl+PageDown': Shortcuts.FOCUS_NEXT_NOTE,
	'CmdOrCtrl+PageUp': Shortcuts.FOCUS_PREVIOUS_NOTE,

	'CmdOrCtrl+Shift+A': Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE,
	'CmdOrCtrl+Shift+B': Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK,

	'CmdOrCtrl+Delete': Shortcuts.DELETE_CURRENT_NOTE,
	'CmdOrCtrl+Shift+R': Shortcuts.RESTORE_CURRENT_NOTE_FROM_BIN,

	'CmdOrCtrl+H': Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL,

	'CmdOrCtrl+L': Shortcuts.LOCK_CURRENT_PROFILE,
	'CmdOrCtrl+S': Shortcuts.SYNC_DATABASE,

	'CmdOrCtrl+F': Shortcuts.FOCUS_SEARCH,

	'CmdOrCtrl+.': Shortcuts.OPEN_GLOBAL_SETTINGS,
};

export const SHORTCUT_NAMES = {
	[Shortcuts.CREATE_NOTE]: 'Create a new note',
	[Shortcuts.CLOSE_CURRENT_NOTE]: 'Close active note',
	[Shortcuts.RESTORE_CLOSED_NOTE]: 'Restore recently closed note',
	[Shortcuts.FOCUS_NEXT_NOTE]: 'Go to next opened note',
	[Shortcuts.FOCUS_PREVIOUS_NOTE]: 'Go to previous opened note',

	[Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE]: 'Move active note in/out of archive',
	[Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK]: 'Move active note in/out of bookmark',

	[Shortcuts.DELETE_CURRENT_NOTE]: 'Delete active note',
	[Shortcuts.RESTORE_CURRENT_NOTE_FROM_BIN]: 'Restore active note from bin',

	[Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL]: 'Show or hide history of active note',

	[Shortcuts.FOCUS_SEARCH]: 'Search notes',
	[Shortcuts.SYNC_DATABASE]: 'Sync vault to disk',

	[Shortcuts.LOCK_CURRENT_PROFILE]: 'Lock vault',
	[Shortcuts.OPEN_GLOBAL_SETTINGS]: 'Open preferences',
};
