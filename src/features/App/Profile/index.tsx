import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { isEqual } from 'lodash';
import { LexemesRegistry } from '@core/features/notes/controller/LexemesRegistry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { HotkeyEventsProvider } from '@features/MainScreen/HotkeyProvaider';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useIsDeveloper } from '@hooks/useIsDeveloper';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	createWorkspaceObject,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { Workspace, WorkspaceContext } from '../Workspace';
import { ProfileStatusBar } from './ProfileStatusBar/ProfileStatusBar';
import { SQLConsole } from './SQLConsole/SQLConsole';
import { ToggleSQLConsole } from './SQLConsole/ToggleSQLConsole';

export type ProfileControls = {
	profile: ProfileContainer;
	api: {
		lexemes: LexemesRegistry;
	};
	close: () => void;
};

export const ProfileControlsContext = createContext<ProfileControls | null>(null);
export const useProfileControls = createContextGetterHook(ProfileControlsContext);

export type ProfileProps = {
	profile: ProfileContainer;
	controls: ProfileControls;
};

export const Profile: FC<ProfileProps> = ({ profile: currentProfile, controls }) => {
	const dispatch = useAppDispatch();

	const profileId = currentProfile.profile.id;

	const workspaces = useAppSelector(
		useMemo(() => selectWorkspacesInfo({ profileId }), [profileId]),
		isEqual,
	);

	const workspacesManager = useMemo(
		() => new WorkspacesController(currentProfile.db),
		[currentProfile.db],
	);
	useEffect(() => {
		workspacesManager.getList().then((workspaces) => {
			const [defaultWorkspace] = workspaces;

			if (!defaultWorkspace) return;

			dispatch(
				workspacesApi.addProfile({
					profileId,
					profile: {
						activeWorkspace: null,
						workspaces: Object.fromEntries(
							workspaces.map((workspace) => [
								workspace.id,
								createWorkspaceObject(workspace),
							]),
						),
					},
				}),
			);
			dispatch(workspacesApi.setActiveProfile(profileId));
			dispatch(
				workspacesApi.setActiveWorkspace({
					profileId,
					workspaceId: defaultWorkspace.id,
				}),
			);
		});

		return () => {
			dispatch(
				workspacesApi.removeProfile({
					profileId,
				}),
			);
		};
	}, [dispatch, profileId, workspacesManager]);

	const [isDBConsoleVisible, setIsDBConsoleVisible] = useState(false);
	const isDevMode = useIsDeveloper();

	const db = controls.profile.db;
	useEffect(() => {
		if (!isDevMode) return;

		(globalThis as any)[Symbol.for('db')] = db;

		return () => {
			delete (globalThis as any)[Symbol.for('db')];
		};
	}, [db, isDevMode]);

	return (
		<ProfileControlsContext.Provider value={controls}>
			{workspaces.map((workspace) =>
				workspace.touched ? (
					<WorkspaceContext.Provider
						key={workspace.id}
						value={{ profileId: profileId, workspaceId: workspace.id }}
					>
						<StatusBarProvider>
							<HotkeyEventsProvider>
								<Workspace profile={currentProfile} />
								<ProfileStatusBar />
								{isDevMode && (
									<ToggleSQLConsole
										isVisible={isDBConsoleVisible}
										onVisibilityChange={setIsDBConsoleVisible}
									/>
								)}
							</HotkeyEventsProvider>
						</StatusBarProvider>
					</WorkspaceContext.Provider>
				) : null,
			)}
			{isDevMode && (
				<SQLConsole
					isVisible={isDBConsoleVisible}
					onVisibilityChange={setIsDBConsoleVisible}
				/>
			)}
		</ProfileControlsContext.Provider>
	);
};
