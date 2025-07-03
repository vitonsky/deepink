export enum SHORTCUT_COMMANDS {
	CREATE_NOTE = 'createNote',
	CLOSE_NOTE = 'closeNote',
	RESTORE_CLOSED_NOTE = 'restoreNote',

	LOCK_PROFILE = 'lock Profile',
}

export type KeyboardShortcutMap = {
	[key: string]: SHORTCUT_COMMANDS;
};

export const shortcuts: KeyboardShortcutMap = {
	'ctrl+n': SHORTCUT_COMMANDS.CREATE_NOTE,
	'ctrl+w': SHORTCUT_COMMANDS.CLOSE_NOTE,
	'ctrl+shift+t': SHORTCUT_COMMANDS.RESTORE_CLOSED_NOTE,

	'ctrl+l': SHORTCUT_COMMANDS.LOCK_PROFILE,
};
