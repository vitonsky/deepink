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

/**
 * Maps shortcut enum values to i18n keys in the settings namespace (hotkeys.shortcuts.*)
 */
export const SHORTCUT_I18N_KEYS: Record<Shortcuts, string> = {
	[Shortcuts.CREATE_NOTE]: 'hotkeys.shortcuts.createNote',
	[Shortcuts.CLOSE_CURRENT_NOTE]: 'hotkeys.shortcuts.closeCurrentNote',
	[Shortcuts.RESTORE_CLOSED_NOTE]: 'hotkeys.shortcuts.restoreClosedNote',
	[Shortcuts.FOCUS_NEXT_NOTE]: 'hotkeys.shortcuts.focusNextNote',
	[Shortcuts.FOCUS_PREVIOUS_NOTE]: 'hotkeys.shortcuts.focusPreviousNote',

	[Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE]: 'hotkeys.shortcuts.toggleArchive',
	[Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK]: 'hotkeys.shortcuts.toggleBookmark',

	[Shortcuts.DELETE_CURRENT_NOTE]: 'hotkeys.shortcuts.deleteNote',
	[Shortcuts.RESTORE_CURRENT_NOTE_FROM_BIN]: 'hotkeys.shortcuts.restoreFromBin',

	[Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL]: 'hotkeys.shortcuts.toggleHistory',

	[Shortcuts.FOCUS_SEARCH]: 'hotkeys.shortcuts.focusSearch',
	[Shortcuts.SYNC_DATABASE]: 'hotkeys.shortcuts.syncDatabase',

	[Shortcuts.LOCK_CURRENT_PROFILE]: 'hotkeys.shortcuts.lockProfile',
	[Shortcuts.OPEN_GLOBAL_SETTINGS]: 'hotkeys.shortcuts.openSettings',
};
