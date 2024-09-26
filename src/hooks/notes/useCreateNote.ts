import { useCallback, useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { useNotesRegistry, useTagsRegistry } from '@features/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/workspaces/hooks';
import { selectActiveTag, selectNotes } from '@state/redux/workspaces/workspaces';

import { useNoteActions } from './useNoteActions';
import { useUpdateNotes } from './useUpdateNotes';

export const useCreateNote = () => {
	const notesRegistry = useNotesRegistry();
	const noteActions = useNoteActions();
	const tagsRegistry = useTagsRegistry();

	const notes = useWorkspaceSelector(selectNotes);
	const activeTag = useWorkspaceSelector(selectActiveTag);

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
	}, [noteActions, notes]);

	return useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag.id]);
		}

		newNoteIdRef.current = noteId;
		updateNotes();
	}, [activeTag, notesRegistry, tagsRegistry, updateNotes]);
};
