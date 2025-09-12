import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import hotkeys from 'hotkeys-js';
import { selectShortcuts } from '@state/redux/settings/settings';

import { useCallNamedCommand } from '../commandHooks';

/**
 * Binds keyboard shortcuts to commands
 *
 * Pressing a shortcut executes the corresponding command
 */
export const useShortcutBinding = () => {
	const shortcuts = useSelector(selectShortcuts);
	const call = useCallNamedCommand();

	useEffect(() => {
		// by default hotkeys library ignores INPUT, SELECT, and TEXTAREA elements, force handling of shortcuts
		// https://github.com/jaywcjlove/hotkeys-js?tab=readme-ov-file#filter
		hotkeys.filter = () => true;

		Object.entries(shortcuts).forEach(([shortcut, commandName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => call(commandName),
			);
		});

		return () => {
			Object.keys(shortcuts).forEach((shortcut) => {
				hotkeys.unbind(shortcut);
			});
		};
	}, [shortcuts, call]);
};
