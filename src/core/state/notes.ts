import { createApi, createEvent, createStore } from 'effector';

import { INote, NoteId } from '../Note';

export const $activeNoteId = createStore<NoteId | null>(null);
export const activeNoteChanged = createEvent<NoteId | null>();
$activeNoteId.on(activeNoteChanged, (_, noteId) => noteId);

export const $openedNotes = createStore<INote[]>([]);
export const openedNotesControls = createApi($openedNotes, {
	add(state, note: INote) {
		const noteInList = state.find(({ id }) => id === note.id);
		if (noteInList) return;

		return [...state, note];
	},

	delete(state, noteId: string) {
		const filteredNotes = state.filter(({ id }) => id !== noteId);
		return filteredNotes.length !== state.length ? filteredNotes : state;
	},

	update(state, note: INote) {
		const noteIndex = state.findIndex(({ id }) => id === note.id);
		if (noteIndex === -1) return;

		return [...state.slice(0, noteIndex), note, ...state.slice(noteIndex + 1)];
	},
});
