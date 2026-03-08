import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { Shortcuts } from '@hooks/shortcuts';
import { useShortcutCallback } from '@hooks/shortcuts/useShortcutCallback';

export const useVaultShortcutsHandlers = () => {
	const command = useCommand();

	useShortcutCallback(Shortcuts.LOCK_CURRENT_PROFILE, () =>
		command(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE),
	);

	useShortcutCallback(Shortcuts.SYNC_DATABASE, () =>
		command(GLOBAL_COMMANDS.SYNC_DATABASE),
	);

	useShortcutCallback(Shortcuts.OPEN_GLOBAL_SETTINGS, () => {
		command(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS);
	});
};
