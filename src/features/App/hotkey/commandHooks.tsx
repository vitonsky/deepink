import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts, ShortcutCommand } from '@state/redux/settings/settings';

import { CommandEventPayload, useCommandEvent } from './CommandEventsProvider';

/**
 * Hook to execute command by name with optional payload
 */
export function useCommandExecutor() {
	const event = useCommandEvent();

	return (id: ShortcutCommand, payload?: {}) => {
		event({ id, payload });
	};
}

/**
 * Hook to bind hotkeys to commands
 */
export const useHotkeyBindings = () => {
	const shortcuts = useSelector(selectShortcuts);

	const execute = useCommandExecutor();

	useEffect(() => {
		Object.entries(shortcuts).forEach(([keyCombination, shortcutName]) => {
			hotkeys(keyCombination, () => {
				execute(shortcutName);
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
export function useCommandSubscription(callback: (data: CommandEventPayload) => void) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		const unsubscribe = commandEvent.watch(callback);
		return () => unsubscribe();
	}, [callback, commandEvent]);
}
