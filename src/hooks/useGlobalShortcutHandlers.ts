import { GLOBAL_COMMANDS } from '@hooks/commands';
import { Shortcuts } from '@hooks/commands/shortcuts';
import { useShortcutCallback } from '@hooks/commands/shortcuts/useShortcutCallback';
import { useCommand } from '@hooks/commands/useCommand';

export const useGlobalShortcutHandlers = () => {
	const command = useCommand();

	useShortcutCallback(Shortcuts.LOCK_CURRENT_PROFILE, () =>
		command(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE),
	);

	useShortcutCallback(Shortcuts.SYNC_DATABASE, () =>
		command(GLOBAL_COMMANDS.SYNC_DATABASE),
	);
};
