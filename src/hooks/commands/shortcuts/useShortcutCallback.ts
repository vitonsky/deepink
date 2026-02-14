import { useCommandCallback } from '../useCommandCallback';
import { GLOBAL_COMMANDS } from '..';
import { Shortcuts } from '.';

/**
 * Runs the callback when the given shortcut is pressed
 */
export const useShortcutCallback = (
	shortcut: Shortcuts,
	callback: () => void,
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	useCommandCallback(
		GLOBAL_COMMANDS.SHORTCUTS_PRESSED,
		({ shortcuts: pressedShortcut }) => {
			if (pressedShortcut !== shortcut) return;
			callback();
		},
		{ enabled },
	);
};
