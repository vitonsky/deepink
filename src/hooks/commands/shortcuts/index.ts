import { GLOBAL_COMMANDS } from '..';

export type KeyboardShortcutMap = {
	[key: string]: GLOBAL_COMMANDS;
};

export const shortcuts: KeyboardShortcutMap = {
	'ctrl+n': GLOBAL_COMMANDS.CREATE_NOTE,
	'ctrl+w': GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
	'ctrl+shift+t': GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,

	'ctrl+up': GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
	'ctrl+down': GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,

	'ctrl+l': GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE,
};
