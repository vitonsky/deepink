import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectHotkeys, ShortcutCommand } from '@state/redux/settings/settings';

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
	const hotkeysSetting = useSelector(selectHotkeys);

	const execute = useCommandExecutor();

	useEffect(() => {
		Object.entries(hotkeysSetting).forEach(([keys, shortcutName]) => {
			hotkeys(keys, () => {
				execute(shortcutName);
			});
		});

		return () => {
			Object.values(hotkeysSetting).forEach((hotkey) => {
				hotkeys.unbind(hotkey);
			});
		};
	}, [hotkeysSetting, execute]);
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
