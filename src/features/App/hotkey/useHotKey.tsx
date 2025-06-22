import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectHotkeys } from '@state/redux/settings/settings';

import {
	CommandEventPayload,
	CommandName,
	CommandPayloadMap,
	useCommandEvents,
} from './HotKeyEventsProvider';

/**
 * Hook to execute commands by name with optional payload
 */
export function useCommandExecutor() {
	const event = useCommandEvents();

	return <K extends CommandName>(id: K, payload?: CommandPayloadMap[K]) => {
		if (payload === undefined || payload === null) {
			event[id]({ id } as CommandEventPayload<K>);
		} else {
			event[id]({ id, payload } as CommandEventPayload<K>);
		}
	};
}

/**
 * Hook to bind hotkeys to commands
 */
export const useHotKey = () => {
	const hotkeysSetting = useSelector(selectHotkeys);

	const execute = useCommandExecutor();

	useEffect(() => {
		const command = Object.entries(hotkeysSetting) as [
			keyof CommandPayloadMap,
			string,
		][];

		command.forEach(([name, hotkey]) => {
			hotkeys(hotkey, () => {
				execute(name);
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
export function useCommandSubscription<K extends CommandName>(
	id: K,
	callback: (payload: CommandEventPayload<K>) => void,
) {
	const commandEvents = useCommandEvents();

	useEffect(() => {
		const unsubscribe = commandEvents[id].watch(callback);
		return () => unsubscribe();
	}, [id, callback, commandEvents]);
}
