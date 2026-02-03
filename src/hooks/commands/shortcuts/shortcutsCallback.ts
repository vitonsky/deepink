import { useCommandCallback } from '../useCommandCallback';
import { GLOBAL_COMMANDS } from '..';
import { Shortcuts } from '.';

export const useShortcutCallback = (shortcuts: Shortcuts, callback: () => void) => {
	useCommandCallback(GLOBAL_COMMANDS.SHORTCUTS_PRESSED, (payload) => {
		if (payload !== shortcuts) return;
		callback();
	});
};
