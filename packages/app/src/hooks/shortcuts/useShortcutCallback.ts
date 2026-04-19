import { GLOBAL_COMMANDS } from '../commands';
import { useCommandCallback } from '../commands/useCommandCallback';
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
		GLOBAL_COMMANDS.SHORTCUT_PRESSED,
		({ shortcut: pressedShortcut }) => {
			if (pressedShortcut !== shortcut) return;
			callback();
		},
		{ enabled },
	);
};
