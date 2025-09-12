import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts } from '@state/redux/settings/settings';

import { useCallNamedCommand } from '../commandHooks';

/**
 * Binds keyboard shortcuts to commands
 */
export const useShortcutBinding = () => {
	const shortcuts = useSelector(selectShortcuts);
	const execute = useCallNamedCommand();

	useEffect(() => {
		// Hotkeys are normally disabled on INPUT, SELECT, and TEXTAREA elements
		// force handling shortcuts regardless of focus
		hotkeys.filter = () => true;

		Object.entries(shortcuts).forEach(([shortcut, commandName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => {
					execute(commandName);
				},
			);
		});

		return () => {
			Object.keys(shortcuts).forEach((shortcut) => {
				hotkeys.unbind(shortcut);
			});
		};
	}, [shortcuts, execute]);
};
