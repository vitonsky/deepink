import { useEffect } from 'react';
import hotkeys from 'hotkeys-js';

import { useCommand } from '../useCommand';
import { CommandPayloadsMap, GLOBAL_COMMANDS } from '..';
import { KeyboardShortcutMap } from '.';

/**
 * Registers keyboard shortcuts for commands
 *
 * Configures the processing of global keyboard shortcuts, associating each combination with a corresponding command
 */
export const useShortcutsBinding = <K extends GLOBAL_COMMANDS>(
	shortcuts: KeyboardShortcutMap,
	getContext?: (command: K) => CommandPayloadsMap[K],
) => {
	const runCommand = useCommand();

	useEffect(() => {
		// By default, the hotkeys library ignores INPUT, SELECT, and TEXTAREA elements,
		// so when the user is focused on the note editor or any other input field, shortcuts won't work
		// We force handling of shortcuts in these cases
		// https://github.com/jaywcjlove/hotkeys-js?tab=readme-ov-file#filter
		// We want to react only on events emitted by real user, not a synthetic
		hotkeys.filter = (event) => event.isTrusted;

		const isMacOS = navigator.userAgent.includes('Mac OS');
		const normalizedShortcuts: KeyboardShortcutMap = Object.fromEntries(
			Object.entries(shortcuts).map(
				([shortcut, command]) =>
					[
						shortcut
							.toLowerCase()
							.replaceAll(/cmdorctrl/g, isMacOS ? 'cmd' : 'ctrl'),
						command,
					] as const,
			),
		);

		Object.entries(normalizedShortcuts).forEach(([shortcut, commandName]) => {
			hotkeys(
				shortcut,
				{
					capture: true,
				},
				() => {
					const payload = getContext?.(commandName as K);
					runCommand(commandName, payload);
				},
			);
		});

		return () => {
			Object.keys(normalizedShortcuts).forEach((shortcut) =>
				hotkeys.unbind(shortcut),
			);
		};
	}, [getContext, runCommand, shortcuts]);
};
