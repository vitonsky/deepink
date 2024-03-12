import { createEvent, createStore, sample } from 'effector';
import { INote, NoteId } from '@core/features/notes';

/**
 * Find a note near current, but except current note in edge cases
 */
const findNearNote = (notes: INote[], noteId: NoteId) => {
	const currentNoteIndex = notes.findIndex((note) => note.id === noteId);
	if (currentNoteIndex === -1) {
		return notes.length === 0 ? null : notes.at(-1) ?? null;
	}

	if (notes.length === 1) return null;

	const prevIndex = currentNoteIndex - 1;
	const nextIndex = currentNoteIndex + 1;
	return notes[prevIndex] ?? notes[nextIndex] ?? null;
};

// TODO: add tests
export const createNotesApi = () => {
	const $notes = createStore<{
		activeNote: NoteId | null;
		openedNotes: INote[];
	}>({
		activeNote: null,
		openedNotes: [],
	});

	const events = {
		activeNoteChanged: createEvent<NoteId | null>(),
		noteOpened: createEvent<INote>(),
		noteUpdated: createEvent<INote>(),
		noteClosed: createEvent<NoteId>(),
		notesClosed: createEvent(),
	};

	// Open note
	sample({
		clock: events.noteOpened,
		source: $notes,
		fn(state, note) {
			const { openedNotes } = state;
			const foundNoteInList = openedNotes.find(({ id }) => id === note.id);

			// Ignore already exists note
			if (foundNoteInList) return state;

			return { ...state, activeNote: note.id, openedNotes: [...openedNotes, note] };
		},
		target: $notes,
	});

	// Close note
	sample({
		clock: events.noteClosed,
		source: $notes,
		fn(state, noteId) {
			const { openedNotes, activeNote } = state;
			const filteredNotes = openedNotes.filter(({ id }) => id !== noteId);

			return {
				...state,
				activeNote:
					activeNote !== noteId
						? activeNote
						: findNearNote(openedNotes, activeNote)?.id ?? null,
				openedNotes:
					filteredNotes.length !== openedNotes.length
						? filteredNotes
						: openedNotes,
			};
		},
		target: $notes,
	});

	// Update note
	sample({
		clock: events.noteUpdated,
		source: $notes,
		fn(state, note) {
			const { openedNotes } = state;

			// Ignore not exists notes
			const noteIndex = openedNotes.findIndex(({ id }) => id === note.id);
			if (noteIndex === -1) return state;

			return {
				...state,
				openedNotes: [
					...openedNotes.slice(0, noteIndex),
					note,
					...openedNotes.slice(noteIndex + 1),
				],
			};
		},
		target: $notes,
	});

	// Close all notes
	sample({
		clock: events.notesClosed,
		source: $notes,
		fn() {
			return $notes.defaultState;
		},
		target: $notes,
	});

	// Update active note
	sample({
		clock: events.activeNoteChanged,
		source: $notes,
		fn(state, noteId) {
			console.log('events.activeNoteChanged', { state, noteId });
			const { activeNote, openedNotes } = state;

			// Skip if value not changed
			if (noteId === activeNote) return state;

			// Set null
			if (noteId === null) return { ...state, activeNote: noteId };

			// Skip if note are not opened
			const isOpenedNote = openedNotes.some((note) => note.id === noteId);
			if (!isOpenedNote) return state;

			return { ...state, activeNote: noteId };
		},
		target: $notes,
	});

	return {
		$notes,
		events,
	};
};

export type NotesApi = ReturnType<typeof createNotesApi>;
