import { useCallback } from 'react';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveTag, selectNewNoteTemplate } from '@state/redux/profiles/profiles';

import { TemplateProcessor } from './TemplateProcessor';
import { useUpdateNotes } from './useUpdateNotes';

export const useCreateNote = () => {
	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const activeTag = useWorkspaceSelector(selectActiveTag);
	const newNoteConfig = useWorkspaceSelector(selectNewNoteTemplate);

	const updateNotes = useUpdateNotes();

	const { openNote } = useNotesContext();

	return useCallback(async () => {
		const templates = new TemplateProcessor({ ignoreParsingErrors: true });

		const noteId = await notesRegistry.add({
			title: templates.compile(newNoteConfig.title),
			text: '',
		});

		// TODO: attach listed tags if they do exist
		if (newNoteConfig.tags === 'selected' && activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag.id]);
		}

		await updateNotes();

		const [note] = await notesRegistry.getById([noteId]);
		if (note) {
			openNote(note);
		}
	}, [activeTag, newNoteConfig, notesRegistry, openNote, tagsRegistry, updateNotes]);
};
