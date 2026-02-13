import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { isEqual } from 'lodash';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { LexemesRegistry } from '@core/features/notes/controller/LexemesRegistry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useShortcutsBinding } from '@hooks/commands/shortcuts/useShortcutsBinding';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useIsDeveloper } from '@hooks/useIsDeveloper';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	createWorkspaceObject,
	defaultVaultConfig,
	ProfileConfigScheme,
	selectWorkspacesInfo,
	WorkspaceConfigScheme,
	WorkspaceData,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { Workspace, WorkspaceContext } from '../Workspace';
import { ProfileStatusBar } from './ProfileStatusBar/ProfileStatusBar';
import { ProfileServices } from './services';
import { SQLConsole } from './SQLConsole/SQLConsole';
import { ToggleSQLConsole } from './SQLConsole/ToggleSQLConsole';
import { useVaultState } from './useVaultState';

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

	const getVaultState = useVaultState({
		sync: Object.keys(workspaces).length > 0,
		controls,
	});

	const workspacesManager = useMemo(
		() => new WorkspacesController(currentProfile.db),
		[currentProfile.db],
	);
	useEffect(() => {
		const vaultConfig = new StateFile(
			new FileController('config.json', controls.profile.files),
			ProfileConfigScheme,
		);

		Promise.all([
			workspacesManager.getList(),
			vaultConfig.get(),
			getVaultState(),
		]).then(async ([workspaces, config, state]) => {
			const [defaultWorkspace] = workspaces;

			const workspaceConfigs = await Promise.all(
				workspaces.map(async (workspace) => {
					const config = await new StateFile(
						new FileController(
							`workspaces/${workspace.id}/config.json`,
							controls.profile.files,
						),
						WorkspaceConfigScheme,
					).get();

					return [workspace.id, config] as const;
				}),
			).then((entries) => Object.fromEntries(entries));

			if (!defaultWorkspace) return;

			dispatch(
				workspacesApi.addProfile({
					profileId,
					profile: {
						activeWorkspace: null,
						workspaces: Object.fromEntries(
							workspaces.map((workspace) => {
								const workspaceObject = createWorkspaceObject(workspace);
								return [
									workspace.id,
									{
										...workspaceObject,
										config: {
											...workspaceObject.config,
											...workspaceConfigs[workspace.id],
										},
									} satisfies WorkspaceData,
								];
							}),
						),
						config: {
							...defaultVaultConfig,
							...config,
						},
					},
				}),
			);
			dispatch(workspacesApi.setActiveProfile(profileId));
			dispatch(
				workspacesApi.setActiveWorkspace({
					profileId,
					workspaceId: state?.activeWorkspace ?? defaultWorkspace.id,
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
	}, [controls.profile.files, dispatch, getVaultState, profileId, workspacesManager]);

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

	useShortcutsBinding();

	useCommandCallback(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE, controls.close);

	return (
		<ProfileControlsContext.Provider value={controls}>
			{workspaces.length > 0 && <ProfileServices />}
			{workspaces.map((workspace) =>
				workspace.touched ? (
					<WorkspaceContext.Provider
						key={workspace.id}
						value={{ profileId: profileId, workspaceId: workspace.id }}
					>
						<StatusBarProvider>
							<Workspace profile={currentProfile} />
							<ProfileStatusBar />
							{isDevMode && (
								<ToggleSQLConsole
									isVisible={isDBConsoleVisible}
									onVisibilityChange={setIsDBConsoleVisible}
								/>
							)}
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
