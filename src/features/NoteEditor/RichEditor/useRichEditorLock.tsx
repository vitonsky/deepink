import { useEffect } from 'react';
import { LexicalEditor } from 'lexical';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNote } from '@state/redux/profiles/profiles';

/**
 * Sets the editor to read-only if the active note is deleted,
 * otherwise applies the provided flag
 */
export const useRichEditorLock = (editor: LexicalEditor, isEditable: boolean) => {
	const activeNote = useWorkspaceSelector(selectActiveNote);

	useEffect(() => {
		if (activeNote?.isDeleted) {
			editor.setEditable(false);
			return;
		}
		editor.setEditable(isEditable);
	}, [activeNote, editor, isEditable]);
};
