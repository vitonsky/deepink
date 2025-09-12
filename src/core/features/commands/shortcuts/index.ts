import { GLOBAL_COMMANDS } from '..';

export type KeyboardShortcutMap = {
	[key: string]: GLOBAL_COMMANDS;
};

export const keyboardShortcuts: KeyboardShortcutMap = {
	'ctrl+n': GLOBAL_COMMANDS.CREATE_NOTE,
	'ctrl+w': GLOBAL_COMMANDS.CLOSE_NOTE,
	'ctrl+shift+t': GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,

	'ctrl+shift+tab': GLOBAL_COMMANDS.NAVIGATE_NOTE_LEFT,
	'ctrl+down': GLOBAL_COMMANDS.NAVIGATE_NOTE_LEFT,

	'ctrl+tab': GLOBAL_COMMANDS.NAVIGATE_NOTE_RIGHT,
	'ctrl+up': GLOBAL_COMMANDS.NAVIGATE_NOTE_RIGHT,

	'ctrl+l': GLOBAL_COMMANDS.LOCK_PROFILE,
};
