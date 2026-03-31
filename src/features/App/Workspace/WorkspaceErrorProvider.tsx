import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const WorkspaceErrorContext = createContext<{
	handleError: (error: Error) => void;
} | null>(null);
export const useWorkspaceError = createContextGetterHook(WorkspaceErrorContext);

export const WorkspaceErrorProvider: FC<
	PropsWithChildren<{ onError: (error: Error, workspaceId: string) => void }>
> = ({ children, onError }) => {
	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			onError(error, workspaceData.workspaceId);

			// Reset the workspace to default
			dispatch(workspacesApi.resetWorkspace(workspaceData));

			telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_OPEN_FAILED);
		},
		[dispatch, onError, telemetry, workspaceData],
	);

	return (
		<WorkspaceErrorContext.Provider value={{ handleError }}>
			{children}
		</WorkspaceErrorContext.Provider>
	);
};
