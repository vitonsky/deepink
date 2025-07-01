import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts } from '@state/redux/settings/settings';

import { CommandEvent, useCommandEvent } from './CommandEventsProvider';
import { SHORTCUT_COMMANDS } from './shortcuts';

/**
 * Hook to execute command by name
 */
export function useCommandExecutor() {
	const event = useCommandEvent();

	return <T extends SHORTCUT_COMMANDS>(commandName: T) => {
		event({ id: commandName });
	};
}

/**
 * Hook to bind hotkeys to commands
 */
export const useHotkeyBindings = () => {
	const shortcuts = useSelector(selectShortcuts);

	const execute = useCommandExecutor();

	useEffect(() => {
		Object.entries(shortcuts).forEach(([keyCombination, commandName]) => {
			hotkeys(keyCombination, () => {
				execute(commandName);
			});
		});

		return () => {
			Object.keys(shortcuts).forEach((keyCombination) => {
				hotkeys.unbind(keyCombination);
			});
		};
	}, [shortcuts, execute]);
};

/**
 * Hook to subscribe to command events
 */
export function useCommandSubscription(
	commandName: SHORTCUT_COMMANDS,
	callback: (data: CommandEvent) => void,
) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		const unsubscribe = commandEvent.watch((data) => {
			if (data.id !== commandName) {
				return;
			}
			callback(data);
		});
		return () => unsubscribe();
	}, [callback, commandEvent, commandName]);
}
