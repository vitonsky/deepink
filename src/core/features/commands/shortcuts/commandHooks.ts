import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts } from '@state/redux/settings/settings';

import { CommandEvent, useCommandEvent } from '../CommandEventProvider';
import { GLOBAL_COMMANDS } from '..';

/**
 * Executes a command by name
 */
export function useCommandExecutor() {
	const event = useCommandEvent();

	return <T extends GLOBAL_COMMANDS>(command: T) => {
		event({ id: command });
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

		Object.entries(shortcuts).forEach(([shortcut, commandName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => {
					execute(commandName);
				},
			);
		});

		return () => {
			Object.keys(shortcuts).forEach((shortcut) => {
				hotkeys.unbind(shortcut);
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
