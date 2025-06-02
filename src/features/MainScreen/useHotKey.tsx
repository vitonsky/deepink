import { useEffect } from 'react';
import { useProfileControls } from '@features/App/Profile';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

// copy functions from https://github.com/translate-tools/linguist/blob/master/src/components/controls/Hotkey/utils.ts
/**
 * Convert key code to unified format
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
 */
export const getUnifiedKeyName = (code: string) => {
	// Skip unidentified codes
	if (code === '' || code === 'Unidentified') return null;

	const prefixesToReplace: Record<string, string> = {
		OS: 'Meta',
		AudioVolume: 'Volume',
	};

	// Return literal with removed prefix
	const literalPrefixes = ['Key', 'Digit'];
	const literalPrefix = literalPrefixes.find((prefix) => code.startsWith(prefix));
	if (literalPrefix !== undefined) {
		return code.slice(literalPrefix.length);
	}

	// Fix prefix
	const prefixToReplace = Object.keys(prefixesToReplace).find((prefix) =>
		code.startsWith(prefix),
	);
	if (prefixToReplace !== undefined) {
		code = prefixesToReplace[prefixToReplace] + code.slice(prefixToReplace.length);
	}

	// Shorten codes with suffix "Left"
	if (!code.startsWith('Arrow') && code.endsWith('Left')) {
		code = code.slice(0, -4);
	}

	return code;
};

export const onHotkeysPressed = (keyActionMap: Record<string, () => void>) => {
	const keyCombinations = Object.keys(keyActionMap).map((k) => k.split('+'));

	const pressedKeys = new Set<string>();

	const onKeyDown = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		// Do not handle already pressed keys
		if (pressedKeys.has(keyName)) return;
		pressedKeys.add(keyName);

		const keys = keyCombinations.find((k) => {
			return k.length > 0 && k.every((key) => pressedKeys.has(key));
		});
		if (!keys) return;

		// Trigger callback only when pressed exact keys, with no unnecessary keys
		const isPressedKeysNumberMatch = pressedKeys.size === keys.length;
		if (isPressedKeysNumberMatch) {
			const action = keyActionMap[keys.join('+')];
			action();
			pressedKeys.clear();
		}
	};

	const onKeyUp = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		if (pressedKeys.has(keyName)) pressedKeys.delete(keyName);
	};

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('keyup', onKeyUp);
	};
};

// the example how store key data in setting
const userHotkeys = {
	createNote: 'Control+N',
	lockProfile: 'Control+L',
	closeNote: 'Control+W',
	reopenClosedNote: 'Control+Alt+T',
};

export const useHotKey = () => {
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const profileControls = useProfileControls();
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	useEffect(() => {
		const keyActionMap: Record<string, () => void> = {
			[userHotkeys.createNote]: () => {
				createNote();
			},
			[userHotkeys.closeNote]: () => {
				if (activeNoteId) noteActions.close(activeNoteId);
			},
			[userHotkeys.lockProfile]: () => {
				profileControls.close();
			},
			[userHotkeys.reopenClosedNote]: () => {
				console.log('open recently close note');
			},
		};

		const unsubscribes = onHotkeysPressed(keyActionMap);

		return () => {
			unsubscribes();
		};
	}, [createNote, profileControls, noteActions, activeNoteId]);
};
