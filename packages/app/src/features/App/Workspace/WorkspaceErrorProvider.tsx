import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const WorkspaceErrorContext = createContext<((error: Error) => void) | null>(null);
export const useWorkspaceError = createContextGetterHook(WorkspaceErrorContext);

export const WorkspaceErrorProvider: FC<
	PropsWithChildren<{ onError: (error: Error, workspaceId: string) => void }>
> = ({ children, onError }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			onError(error, workspaceData.workspaceId);

			// Reset corrupted workspace to default state
			dispatch(
				workspacesApi.resetWorkspace({
					...workspaceData,
					newNoteTemplate: t('note.title.defaultTemplate', {
						date: '{date:D MMM YYYY, HH:mm}',
					}),
				}),
			);

			telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_OPEN_FAILED);
		},
		[dispatch, onError, t, telemetry, workspaceData],
	);

	return (
		<WorkspaceErrorContext.Provider value={handleError}>
			{children}
		</WorkspaceErrorContext.Provider>
	);
};
