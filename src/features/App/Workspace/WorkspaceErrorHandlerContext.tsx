import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const WorkspaceErrorHandlerContext = createContext<{
	handleError: (error: Error) => void;
} | null>(null);
export const useWorkspaceErrorHandlerContext = createContextGetterHook(
	WorkspaceErrorHandlerContext,
);

export const WorkspaceErrorHandlerProvider: FC<
	PropsWithChildren<{ onError: (error: Error, workspaceId: string) => void }>
> = ({ children, onError }) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			onError(error, workspaceData.workspaceId);

			// Reset the workspace to default
			dispatch(workspacesApi.resetWorkspace(workspaceData));
		},
		[dispatch, onError, workspaceData],
	);

	return (
		<WorkspaceErrorHandlerContext.Provider value={{ handleError }}>
			{children}
		</WorkspaceErrorHandlerContext.Provider>
	);
};
