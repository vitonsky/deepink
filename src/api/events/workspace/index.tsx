import { NoteId } from '@core/features/notes';

export enum WorkspaceEvents {
	NOTES_UPDATED = 'notesUpdated',
	NOTE_UPDATED = 'noteUpdated',
	NOTE_HISTORY_UPDATED = 'noteHistoryUpdated',
}

/**
 * Events payload map
 */

export type WorkspaceEventsPayloadMap = {
	[WorkspaceEvents.NOTES_UPDATED]: void;

	/**
	 * Fired when specific note  has been updated
	 */
	[WorkspaceEvents.NOTE_UPDATED]: NoteId;

	/**
	 * Fired when history of specific note has been updated
	 */
	[WorkspaceEvents.NOTE_HISTORY_UPDATED]: NoteId;
};
