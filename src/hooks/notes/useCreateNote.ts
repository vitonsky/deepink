import { useCallback } from 'react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { telemetry } from '@electron/requests/telemetry/renderer';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveTag } from '@state/redux/profiles/profiles';

import { useUpdateNotes } from './useUpdateNotes';

export const useCreateNote = () => {
	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const activeTag = useWorkspaceSelector(selectActiveTag);

	const updateNotes = useUpdateNotes();

	const { openNote } = useNotesContext();

	return useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag.id]);
		}

		await updateNotes();

		const note = await notesRegistry.getById(noteId);
		if (note) {
			openNote(note);
		}

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CREATED);
	}, [activeTag, notesRegistry, openNote, tagsRegistry, updateNotes]);
};
