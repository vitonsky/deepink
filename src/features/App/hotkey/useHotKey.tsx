import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Event } from 'effector';
import hotkeys from 'hotkeys-js';
import { selectHotkeys } from '@state/redux/settings/settings';

import {
	CommandEventPayload,
	CommandPayloadMap,
	useHotkeyEvents,
} from './HotKeyEventsProvider';

export const useHotKey = () => {
	const hotkeysSetting = useSelector(selectHotkeys);
	const events = useHotkeyEvents();

	useEffect(() => {
		const command = Object.entries(hotkeysSetting) as [
			keyof CommandPayloadMap,
			string,
		][];

		for (const [name, hotkey] of command) {
			hotkeys(hotkey, () => {
				switch (name) {
					case 'createNote': {
						events[name]({ id: name });
						break;
					}
					case 'closeNote': {
						events[name]({ id: name });
						break;
					}
					case 'openClosedNote': {
						events[name]({ id: name });
						break;
					}
					case 'lockProfile': {
						events[name]({ id: name });
						break;
					}
				}
			});
		}

		return () => {
			for (const hotkey of Object.values(hotkeysSetting)) {
				hotkeys.unbind(hotkey);
			}
		};
	}, [events, hotkeysSetting]);
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
