export enum GlobalEvents {
	PANEL_RESIZE = 'PANEL_RESIZE',
}

/**
 * Events payload map
 */

export type GlobalEventsPayloadMap = {
	/**
	 * Fired when panel has been resized
	 */
	[GlobalEvents.PANEL_RESIZE]: {
		workspaceId: string;
		panelId: string;
		layout: number[];
	};
};
