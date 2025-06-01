import { useEffect } from 'react';
import { useProfileControls } from '@features/App/Profile';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

/**
 * Key and key modifier
 */
type Hotkey = {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
};

type HotKeyMap = {
	[action: string]: Hotkey;
};

// the example how store key data in setting
const userHotkeys: HotKeyMap = {
	createNote: { key: 'n', ctrl: true },
	lockProfile: { key: 'l', ctrl: true },
	closeNote: { key: 'w', ctrl: true },
	reopenClosedNote: { key: 't', alt: true, shift: true },
};

function isActionMatch(event: KeyboardEvent) {
	for (const [action, hotkey] of Object.entries(userHotkeys)) {
		if (
			(event.key.toLowerCase() === hotkey.key && event.ctrlKey == hotkey.ctrl) ||
			event.altKey == hotkey.alt ||
			event.shiftKey == hotkey.shift
		) {
			return action;
		}
	}
	return;
}

export const useHotKey = () => {
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const profileControls = useProfileControls();
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	useEffect(() => {
		const handleKeyPress = async (event: KeyboardEvent) => {
			const keyAction = isActionMatch(event);

			if (keyAction === 'createNote') {
				await createNote();
			}
			if (keyAction === 'closeNote') {
				profileControls.close();
			}
			if (keyAction === 'lockProfile') {
				if (activeNoteId) noteActions.close(activeNoteId);
			}
			if (keyAction === 'reopenClosedNote') {
				// store in redux state the recently close note and update value each close note
				console.log('open recently close note');
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [createNote, profileControls, noteActions, activeNoteId]);
};
