import React, { createContext, FC, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { ModalWindowProvider } from '@features/ModalWindow/useModalWindow';
import { SplashScreen } from '@features/SplashScreen';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveWorkspaceInfo,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { useProfileSyncButton } from '../Profile/ProfileStatusBar/useProfileSyncButton';
import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { useWorkspace } from './useWorkspace';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceStatusBarItems } from './WorkspaceStatusBarItems';

export const WorkspaceContext = createContext<{
	workspaceId: string;
	profileId: string;
} | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);

export interface WorkspaceProps {
	profile: ProfileContainer;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	useProfileSyncButton();

	const { name: workspaceName } = useWorkspaceSelector(selectWorkspaceName);

	// Close notes by unmount
	useEffect(() => {
		return () => {
			// TODO: use actual workspace id once will be implemented
			dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: null }));
			dispatch(workspacesApi.setOpenedNotes({ ...workspaceData, notes: [] }));
			dispatch(workspacesApi.setNotes({ ...workspaceData, notes: [] }));
		};
	}, [dispatch, workspaceData]);

	// Run optional services for active profile
	useEffect(() => {
		if (!workspace) return;

		const { filesRegistry } = workspace;

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [workspace]);

	// TODO: replace to hook
	// Load tags
	useEffect(() => {
		if (!workspace) return;

		const { tagsRegistry } = workspace;
		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));
			});

		updateTags();

		const cleanup = tagsRegistry.onChange(updateTags);
		return cleanup;
	}, [dispatch, workspace, workspaceData]);

	const { profileId } = useWorkspaceData();

	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);
	const isVisibleWorkspace =
		activeWorkspace && activeWorkspace.id === workspaceData.workspaceId;

	return (
		<Box
			data-workspace={workspaceName}
			sx={{
				display: isVisibleWorkspace ? 'flex' : 'none',
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
				height: '100vh',
				maxWidth: '100%',
				maxHeight: '100%',
				backgroundColor: 'surface.background',
				color: 'typography.primary',
			}}
		>
			{workspace ? (
				<WorkspaceProvider
					{...workspace}
					notesApi={{
						openNote: (note: INote, focus = true) => {
							dispatch(
								workspacesApi.addOpenedNote({ ...workspaceData, note }),
							);

							if (focus) {
								dispatch(
									workspacesApi.setActiveNote({
										...workspaceData,
										noteId: note.id,
									}),
								);
							}
						},
						noteUpdated: (note: INote) =>
							dispatch(
								workspacesApi.updateOpenedNote({
									...workspaceData,
									note,
								}),
							),
						noteClosed: (noteId: string) =>
							dispatch(
								workspacesApi.removeOpenedNote({
									...workspaceData,
									noteId,
								}),
							),
					}}
				>
					<ModalWindowProvider isVisible={isVisibleWorkspace ?? false}>
						<MainScreen />
						<WorkspaceStatusBarItems />
					</ModalWindowProvider>
				</WorkspaceProvider>
			) : (
				<SplashScreen />
			)}
		</Box>
	);
};
