import { Shortcuts } from '@hooks/shortcuts';
import { useShortcutCallback } from '@hooks/shortcuts/useShortcutCallback';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

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
