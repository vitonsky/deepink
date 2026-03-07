import React, { createContext, FC, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultShortcutsHandlers } from '@features/App/Profile/useVaultShortcutsHandlers';
import { SplashScreen } from '@features/SplashScreen';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useShortcutsBinding } from '@hooks/shortcuts/useShortcutsBinding';
import { useIsDeveloper } from '@hooks/useIsDeveloper';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	createWorkspaceObject,
	defaultVaultConfig,
	ProfileConfigScheme,
	selectIsActiveWorkspaceReady,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { WorkspaceContainer } from '../Workspace/WorkspaceContainer';
import { ProfileServices } from './services';
import { useVaultState } from './useVaultState';

export type ProfileControls = {
	profile: ProfileContainer;
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
						config: {
							...defaultVaultConfig,
							...config,
						},
					},
				}),
			);
			dispatch(workspacesApi.setActiveProfile(profileId));

			const selectedWorkspace =
				(state?.activeWorkspace &&
					workspaces.find((w) => w.id === state.activeWorkspace)) ||
				defaultWorkspace;
			dispatch(
				workspacesApi.setActiveWorkspace({
					profileId,
					workspaceId: selectedWorkspace.id,
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
	useVaultShortcutsHandlers();

	useCommandCallback(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE, () => controls.close(), {
		enabled: controls.profile.profile.isEncrypted,
	});
	useCommandCallback(GLOBAL_COMMANDS.SYNC_DATABASE, () => db.sync());

	const isActiveWorkspaceReady = useAppSelector(
		selectIsActiveWorkspaceReady({ profileId }),
	);

	return (
		<ProfileControlsContext.Provider value={controls}>
			{!isActiveWorkspaceReady && <SplashScreen />}
			{workspaces.length > 0 && <ProfileServices />}

			{workspaces.map((workspace) =>
				workspace.touched ? (
					<WorkspaceContainer
						key={workspace.id}
						profile={currentProfile}
						workspaceId={workspace.id}
					>
						{isDevMode && (
							<ToggleSQLConsole
								isVisible={isDBConsoleVisible}
								onVisibilityChange={setIsDBConsoleVisible}
							/>
						)}
					</WorkspaceContainer>
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
