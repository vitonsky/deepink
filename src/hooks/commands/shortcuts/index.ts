import { GLOBAL_COMMANDS } from '..';

export type KeyboardShortcutMap = Record<string, GLOBAL_COMMANDS>;

export const shortcuts: KeyboardShortcutMap = {
	'CmdOrCtrl+N': GLOBAL_COMMANDS.CREATE_NOTE,
	'CmdOrCtrl+W': GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
	'CmdOrCtrl+Shift+T': GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,

	'CmdOrCtrl+PageDown': GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
	'CmdOrCtrl+PageUp': GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,

	'CmdOrCtrl+L': GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE,
};
