import { useEffect } from 'react';
import hotkeys from 'hotkeys-js';

import { useCommand } from '../useCommand';
import { GLOBAL_COMMANDS } from '..';
import { SHORTCUTS_MAP } from '.';

/**
 * Registers keyboard shortcuts for shortcut
 *
 * Configures the processing of global keyboard shortcuts, associating each combination with a command
 */
export const useShortcutsBinding = () => {
	const runCommand = useCommand();

	useEffect(() => {
		// By default, the hotkeys library ignores INPUT, SELECT, and TEXTAREA elements,
		// so when the user is focused on the note editor or any other input field, shortcuts won't work
		// We force handling of shortcuts in these cases
		// https://github.com/jaywcjlove/hotkeys-js?tab=readme-ov-file#filter
		// We want to react only on events emitted by real user, not a synthetic
		hotkeys.filter = (event) => event.isTrusted;

		const isMacOS = navigator.userAgent.includes('Mac OS');
		const normalizedShortcuts = Object.fromEntries(
			Object.entries(SHORTCUTS_MAP).map(
				([shortcut, shortcutName]) =>
					[
						shortcut
							.toLowerCase()
							.replaceAll(/cmdorctrl/g, isMacOS ? 'cmd' : 'ctrl'),
						shortcutName,
					] as const,
			),
		);

		Object.entries(normalizedShortcuts).forEach(([shortcut, shortcutName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => runCommand(GLOBAL_COMMANDS.SHORTCUTS_PRESSED, shortcutName),
			);
		});

		return () => {
			Object.keys(normalizedShortcuts).forEach((shortcut) =>
				hotkeys.unbind(shortcut),
			);
		};
	}, [runCommand]);
};
