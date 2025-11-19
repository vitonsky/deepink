import React, { useEffect, useRef } from 'react';
import {
	ImperativePanelGroupHandle,
	PanelGroup,
	PanelGroupProps,
} from 'react-resizable-panels';
import { GlobalEvents } from '@api/events/global';
import { useWorkspaceContext } from '@features/App/Workspace';
import { useEventBus } from '@hooks/events/useEventBus';

/**
 * The same as `PanelGroup`, but automatically sync panels size across workspaces.
 *
 * When `autoSaveId` is provided and panel size change occurs, this component
 * emit event that will be handled by instances in other workspaces,
 * and panels size there will be automatically updated.
 *
 * @link https://www.npmjs.com/package/react-resizable-panels
 */
export const SyncedPanelGroup = (props: PanelGroupProps) => {
	const events = useEventBus();
	const { workspaceId } = useWorkspaceContext();

	const { autoSaveId: syncId } = props;

	const panelRef = useRef<ImperativePanelGroupHandle | null>(null);
	useEffect(() => {
		if (!syncId) return;

		return events.listen(GlobalEvents.PANEL_RESIZE, (event) => {
			const panel = panelRef.current;
			if (!panel) return;

			// Sync is not needed in workspace where event occurs
			if (workspaceId === event.workspaceId) return;

			// Sync only panels with the same id
			if (syncId !== event.panelId) return;

			panel.setLayout(event.layout);
		});
	}, [events, syncId, workspaceId]);

	return (
		<PanelGroup
			{...props}
			ref={panelRef}
			onLayout={(layout) => {
				if (syncId) {
					events.emit(GlobalEvents.PANEL_RESIZE, {
						workspaceId: workspaceId,
						panelId: syncId,
						layout,
					});
				}
			}}
		/>
	);
};
