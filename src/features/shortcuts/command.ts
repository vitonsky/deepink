export enum GLOBAL_COMMANDS {
	CREATE_NOTE = 'createNote',
	CLOSE_NOTE = 'closeNote',
	RESTORE_CLOSED_NOTE = 'restoreNote',

	OPEN_PREVIOUSLY_NOTE = 'openPreviouslyNote',
	OPEN_NEXT_NOTE = 'openNextNote',

	LOCK_PROFILE = 'lock Profile',
}

export type KeyboardShortcutMap = {
	[key: string]: GLOBAL_COMMANDS;
};

export const keyboardShortcuts: KeyboardShortcutMap = {
	'ctrl+n': GLOBAL_COMMANDS.CREATE_NOTE,
	'ctrl+w': GLOBAL_COMMANDS.CLOSE_NOTE,
	'ctrl+shift+t': GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,

	'ctrl+shift+tab': GLOBAL_COMMANDS.OPEN_PREVIOUSLY_NOTE,
	'ctrl+down': GLOBAL_COMMANDS.OPEN_PREVIOUSLY_NOTE,

	'ctrl+tab': GLOBAL_COMMANDS.OPEN_NEXT_NOTE,
	'ctrl+up': GLOBAL_COMMANDS.OPEN_NEXT_NOTE,

	'ctrl+l': GLOBAL_COMMANDS.LOCK_PROFILE,
};
