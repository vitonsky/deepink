import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Event } from 'effector';
import hotkeys from 'hotkeys-js';
import { selectHotkeys } from '@state/redux/settings/settings';

import {
	CommandEventPayload,
	CommandPayloadMap,
	useExecuteCommand,
} from './HotKeyEventsProvider';

export const useHotKey = () => {
	const hotkeysSetting = useSelector(selectHotkeys);
	const executeCommand = useExecuteCommand();

	useEffect(() => {
		const command = Object.entries(hotkeysSetting) as [
			keyof CommandPayloadMap,
			string,
		][];

		for (const [name, hotkey] of command) {
			hotkeys(hotkey, () => {
				executeCommand(name);
			});
		}

		return () => {
			for (const hotkey of Object.values(hotkeysSetting)) {
				hotkeys.unbind(hotkey);
			}
		};
	}, [executeCommand, hotkeysSetting]);
};

export function useEventSubscribe<K extends keyof CommandPayloadMap>(
	event: Event<CommandEventPayload<K>>,
	callback: (payload: CommandEventPayload<K>) => void,
) {
	useEffect(() => {
		const unsubscribe = event.watch(callback);
		return () => unsubscribe();
	}, [event, callback]);
}
