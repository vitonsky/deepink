import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts } from '@state/redux/settings/settings';

import { GLOBAL_COMMANDS } from './command';
import { CommandEvent, useCommandEvent } from './CommandEventProvider';

/**
 * Executes a command by name
 */
export function useCommandExecutor() {
	const event = useCommandEvent();

	return <T extends GLOBAL_COMMANDS>(commandName: T) => {
		event({ id: commandName });
	};
}

/**
 * Binds keyboard shortcuts to commands
 */
export const useShortcutBinding = () => {
	const shortcuts = useSelector(selectShortcuts);
	const execute = useCommandExecutor();

	useEffect(() => {
		// Hotkeys are normally disabled on INPUT, SELECT, and TEXTAREA elements
		// force handling shortcuts regardless of focus
		hotkeys.filter = () => true;

		Object.entries(shortcuts).forEach(([shortcutKey, commandName]) => {
			hotkeys(shortcutKey, () => {
				execute(commandName);
			});
		});

		return () => {
			Object.keys(shortcuts).forEach((shortcutKey) => {
				hotkeys.unbind(shortcutKey);
			});
		};
	}, [shortcuts, execute]);
};

/**
 * Subscribes to command event
 */
export function useCommandSubscription(
	command: GLOBAL_COMMANDS,
	callback: (data: CommandEvent) => void,
) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		const unsubscribe = commandEvent.watch((data) => {
			if (data.id !== command) return;

			callback(data);
		});
		return () => unsubscribe();
	}, [callback, commandEvent, command]);
}
