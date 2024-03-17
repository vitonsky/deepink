import { useCallback, useEffect, useRef } from 'react';
import { useStoreMap } from 'effector-react';
import { NoteId } from '@core/features/notes';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsContext,
	useTagsRegistry,
	useWorkspaceContext,
} from '@features/Workspace/WorkspaceProvider';

import { useNoteActions } from './useNoteActions';
import { useUpdateNotes } from './useUpdateNotes';

export const useCreateNote = () => {
	const { events: workspaceEvents } = useWorkspaceContext();

	const notesRegistry = useNotesRegistry();
	const noteActions = useNoteActions();
	const tagsRegistry = useTagsRegistry();

	const { $notes } = useNotesContext();
	const notes = useStoreMap($notes, ({ notes }) => notes);

	const { $tags } = useTagsContext();
	const activeTagId = useStoreMap($tags, ({ selected }) => selected);

	const updateNotes = useUpdateNotes();

	// Focus on new note
	const newNoteIdRef = useRef<NoteId | null>(null);
	useEffect(() => {
		if (newNoteIdRef.current === null) return;

		const newNoteId = newNoteIdRef.current;
		const isNoteExists = notes.find((note) => note.id === newNoteId);
		if (isNoteExists) {
			newNoteIdRef.current = null;
			noteActions.click(newNoteId);
		}
	}, [notes, noteActions.click]);

	return useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTagId) {
			await tagsRegistry.setAttachedTags(noteId, [activeTagId]);
			workspaceEvents.tagAttachmentsChanged([
				{
					tagId: activeTagId,
					target: noteId,
					state: 'add',
				},
			]);
		}

		newNoteIdRef.current = noteId;
		updateNotes();
	}, [activeTagId, notesRegistry, tagsRegistry, updateNotes, workspaceEvents]);
};
