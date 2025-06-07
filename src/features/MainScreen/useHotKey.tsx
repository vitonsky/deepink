import { useEffect } from 'react';
import { Event } from 'effector';
import hotkeys from 'hotkeys-js';

import { CommandEvent, CommandPayloadMap, useHotKeyEvents } from './HotkeyProvaider';

export const useHotKey = ({
	noteId,
	profileId,
}: {
	noteId: string | null;
	profileId?: string;
}) => {
	const events = useHotKeyEvents();

	useEffect(() => {
		// TODO: read from redux the hotkey setting
		hotkeys('ctrl+n', () => {
			events.createNoteEvent({ id: 'createNote' });
		});

		hotkeys('ctrl+w', () => {
			if (!noteId) throw new Error('node id not provide');
			events.closeNoteEvent({
				id: 'closeNote',
				payload: { noteId },
			});
		});

		hotkeys('ctrl+L', () => {
			events.lockProfileEvent({ id: 'lockProfile', payload: { profileId } });
		});

		return () => {
			hotkeys.unbind('ctrl+n');
			hotkeys.unbind('ctrl+w');
			hotkeys.unbind('ctrl+l');
		};
	}, [noteId, profileId, events]);
};

export function useEventSubscribe<K extends keyof CommandPayloadMap>(
	event: Event<CommandEvent<K>>,
	callback: (payload: CommandEvent<K>) => void,
) {
	useEffect(() => {
		const unsubscribe = event.watch(callback);
		return () => unsubscribe();
	}, [event, callback]);
}
