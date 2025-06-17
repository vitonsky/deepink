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

export const useHotKey = ({
	noteId,
	profileId,
	closedNoteId,
}: {
	noteId?: string;
	profileId?: string;
	closedNoteId?: string;
}) => {
	const hotkeysSetting = useSelector(selectHotkeys);
	const events = useHotkeyEvents();

	useEffect(() => {
		const entries = Object.entries(hotkeysSetting) as [
			keyof CommandPayloadMap,
			string,
		][];

		for (const [commandName, hotkey] of entries) {
			hotkeys(hotkey, () => {
				switch (commandName) {
					case 'createNote': {
						events[commandName]({ id: commandName });
						break;
					}
					case 'closeNote': {
						if (!noteId) throw new Error('noteId not provided');
						events[commandName]({
							id: commandName,
							payload: { noteId },
						});
						break;
					}
					case 'openClosedNote': {
						if (!closedNoteId)
							throw new Error('recentlyClosedNote not provided');
						events[commandName]({
							id: commandName,
							payload: { noteId: closedNoteId },
						});
						break;
					}
					case 'lockProfile': {
						events[commandName]({ id: commandName });
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
	}, [noteId, profileId, hotkeysSetting, events, closedNoteId]);
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
