import { PROFILE_SCREEN } from '@features/App';

export enum GLOBAL_COMMANDS {
	/**
	 * Create and open a new note
	 */
	CREATE_NOTE = 'createNote',

	/**
	 * Close the current note
	 */
	CLOSE_CURRENT_NOTE = 'closeCurrentNote',

	/**
	 * Reopen the last closed note
	 */
	RESTORE_CLOSED_NOTE = 'restoreClosedNote',

	/**
	 * Switch focus to the next open note
	 */
	FOCUS_NEXT_NOTE = 'focusNextNote',

	/**
	 * Switch focus to the previous open note
	 */
	FOCUS_PREVIOUS_NOTE = 'focusPreviousNote',

	/**
	 * Lock the currently active user profile
	 */
	LOCK_CURRENT_PROFILE = 'lockCurrentProfile',

	/**
	 * Open global settings window
	 */
	OPEN_GLOBAL_SETTINGS = 'OPEN_GLOBAL_SETTINGS',

	/**
	 * Open screen for managing profiles: create, change profiles, etc.
	 */
	OPEN_PROFILE_SCREEN = 'OPEN_PROFILE_SCREEN',
}

type CommandsWithPayload = {
	[GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN]: {
		screen: PROFILE_SCREEN;
	};
};

export type CommandPayloadsMap = Record<
	GLOBAL_COMMANDS,
	K extends keyof CommandsWithPayload ? CommandsWithPayload[K] : void
>;
