import { useEffect } from 'react';
import hotkeys from 'hotkeys-js';

import { useCommand } from '../commandHooks';
import { shortcuts } from '.';

/**
 * Registers keyboard shortcuts for commands
 *
 * Configures the processing of global keyboard shortcuts, associating each combination with a corresponding command
 */
export const useRegisterCommandShortcuts = () => {
	const runCommand = useCommand();

	useEffect(() => {
		// By default, the hotkeys library ignores INPUT, SELECT, and TEXTAREA elements,
		// so when the user is focused on the note editor or any other input field, shortcuts won't work
		// We force handling of shortcuts in these cases
		// https://github.com/jaywcjlove/hotkeys-js?tab=readme-ov-file#filter
		hotkeys.filter = () => true;

		Object.entries(shortcuts).forEach(([shortcut, commandName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => {
					runCommand(commandName);
				},
			);
		});

		return () => {
			Object.keys(shortcuts).forEach((shortcut) => hotkeys.unbind(shortcut));
		};
	}, [runCommand]);
};
