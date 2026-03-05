import { Shortcuts } from '@hooks/shortcuts';
import { useShortcutCallback } from '@hooks/shortcuts/useShortcutCallback';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

/**
 * Runs the callback when the given shortcut is pressed and automatically unsubscribes when the workspace is not active
 */
export const useWorkspaceShortcutsCallback = (
	shortcut: Shortcuts,
	callback: () => void,
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	const isActiveWorkspace = useIsActiveWorkspace();

	useShortcutCallback(shortcut, callback, {
		enabled: isActiveWorkspace && enabled,
	});
};
