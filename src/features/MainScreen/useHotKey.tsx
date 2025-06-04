import { useEffect } from 'react';
import { createEvent, Event } from 'effector';
import hotkeys from 'hotkeys-js';

// the example how store key data in setting
// const userHotkeys = {
// 	createNote: 'Control+N',
// 	lockProfile: 'Control+L',
// 	closeNote: 'Control+W',
// 	reopenClosedNote: 'Control+Alt+T',
// };

type CommandPayloadMap = {
	closeNote: { noteId: string };
	createNote: {};
};

type CommandEvent<K extends keyof CommandPayloadMap = keyof CommandPayloadMap> =
	CommandPayloadMap[K] extends undefined | void
		? { id: K }
		: { id: K; payload?: CommandPayloadMap[K] };

export const useHotKey = () => {
	// auto create event
	const createNoteEvent = createEvent<CommandEvent<'createNote'>>();
	const closeNoteEvent = createEvent<CommandEvent<'closeNote'>>();

	useEffect(() => {
		hotkeys('ctrl+n', () => {
			createNoteEvent({ id: 'createNote' });
		});

		hotkeys('ctrl+w', () => {
			closeNoteEvent({
				id: 'closeNote',
				payload: { noteId: '123' },
			});
		});

		return () => {
			hotkeys.unbind('ctrl+n');
			hotkeys.unbind('ctrl+w');
		};
	}, [closeNoteEvent, createNoteEvent]);

	return { closeNoteEvent, createNoteEvent };
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
