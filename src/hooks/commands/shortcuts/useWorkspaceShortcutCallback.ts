import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

import { useShortcutCallback } from './useShortcutCallback';
import { Shortcuts } from '.';

export const useWorkspaceShortcutCallback = (
	shortcut: Shortcuts,
	callback: () => void,
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	const isActiveWorkspace = useIsActiveWorkspace();

	useShortcutCallback(shortcut, callback, { enabled: isActiveWorkspace && enabled });
};
