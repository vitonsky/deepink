export enum Shortcuts {
	CREATE_NOTE,
	CLOSE_CURRENT_NOTE,
	RESTORE_CLOSED_NOTE,
	FOCUS_NEXT_NOTE,
	FOCUS_PREVIOUS_NOTE,

	TOGGLE_CURRENT_NOTE_ARCHIVE,
	TOGGLE_CURRENT_NOTE_BOOKMARK,

	DELETE_NOTE,
	RESTORE_NOTE_FROM_BIN,

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

	'CmdOrCtrl+Delete': Shortcuts.DELETE_NOTE,
	'CmdOrCtrl+Shift+R': Shortcuts.RESTORE_NOTE_FROM_BIN,

	'CmdOrCtrl+H': Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL,

	'CmdOrCtrl+L': Shortcuts.LOCK_CURRENT_PROFILE,
	'CmdOrCtrl+S': Shortcuts.SYNC_DATABASE,

	'CmdOrCtrl+F': Shortcuts.FOCUS_SEARCH,

	'CmdOrCtrl+,': Shortcuts.OPEN_GLOBAL_SETTINGS,
};

export const SHORTCUT_NAMES = {
	[Shortcuts.CREATE_NOTE]: 'Create note',
	[Shortcuts.CLOSE_CURRENT_NOTE]: 'Close current note',
	[Shortcuts.RESTORE_CLOSED_NOTE]: 'Restore closed note',
	[Shortcuts.FOCUS_NEXT_NOTE]: 'Go to next tab',
	[Shortcuts.FOCUS_PREVIOUS_NOTE]: 'Go to previous tab',

	[Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE]: 'Toggle archive status of the current note',
	[Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK]:
		'Toggle bookmark status of the current note',

	[Shortcuts.DELETE_NOTE]: 'Delete current note',
	[Shortcuts.RESTORE_NOTE_FROM_BIN]: 'Restore current note from bin',

	[Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL]: 'Toggle the note’s history panel',

	[Shortcuts.SYNC_DATABASE]: 'Save changes',
	[Shortcuts.FOCUS_SEARCH]: 'Focus on the search input',

	[Shortcuts.LOCK_CURRENT_PROFILE]: 'Lock vault',
	[Shortcuts.OPEN_GLOBAL_SETTINGS]: 'Open preferences',
};
