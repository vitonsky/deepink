import React, {
	createContext,
	FC,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultShortcutsHandlers } from '@features/App/Profile/useVaultShortcutsHandlers';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
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
	selectActiveWorkspaceInfo,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectIsActiveWorkspaceLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { Workspace, WorkspaceContext } from '../Workspace';
import { WorkspaceError } from '../Workspace/WorkspaceError';
import { WorkspaceErrorProvider } from '../Workspace/WorkspaceErrorProvider';
import { ProfileStatusBar } from './ProfileStatusBar/ProfileStatusBar';
import { ProfileServices } from './services';
import { useVaultState } from './useVaultState';
import { useVaultError } from './VaultErrorProvider';

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

	const { handleError } = useVaultError();

	const getVaultState = useVaultState({
		sync: Object.keys(workspaces).length > 0,
		controls,
	});

	const workspacesManager = useMemo(
		() => new WorkspacesController(currentProfile.db),
		[currentProfile.db],
	);
	useEffect(() => {
		let isProfileLoadCancelled = false;

		const vaultConfig = new StateFile(
			new FileController('config.json', controls.profile.files),
			ProfileConfigScheme,
		);

		Promise.all([workspacesManager.getList(), vaultConfig.get(), getVaultState()])
			.then(async ([workspaces, config, state]) => {
				if (isProfileLoadCancelled) return;
				const [defaultWorkspace] = workspaces;

				if (!defaultWorkspace) throw new Error('No workspaces found in vault');

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

				let selectedWorkspace = defaultWorkspace;
				if (state?.activeWorkspace) {
					selectedWorkspace =
						workspaces.find((w) => w.id === state.activeWorkspace) ??
						defaultWorkspace;
				}
				dispatch(
					workspacesApi.setActiveWorkspace({
						profileId,
						workspaceId: selectedWorkspace.id,
					}),
				);
			})
			.catch((error) => {
				if (isProfileLoadCancelled) return;

				handleError(error);
			});

		return () => {
			isProfileLoadCancelled = true;
			dispatch(
				workspacesApi.removeProfile({
					profileId,
				}),
			);
		};
	}, [
		controls.profile.files,
		dispatch,
		getVaultState,
		handleError,
		profileId,
		workspacesManager,
	]);

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

	const isActiveWorkspaceLoaded = useAppSelector(
		selectIsActiveWorkspaceLoaded({ profileId }),
	);

	const [workspaceErrors, setWorkspaceErrors] = useState<Record<string, Error>>({});
	const activeWorkspace = useAppSelector(selectActiveWorkspaceInfo({ profileId }));
	const activeWorkspaceError = activeWorkspace
		? (workspaceErrors[activeWorkspace.id] ?? null)
		: null;
	const [isLoadingComplete] = useDebounce(
		isActiveWorkspaceLoaded || activeWorkspaceError,
		500,
		{
			leading: true,
		},
	);

	const handleWorkspaceError = useCallback((error: Error, workspaceId: string) => {
		setWorkspaceErrors((prev) => ({ ...prev, [workspaceId]: error }));
	}, []);
	const handleResetWorkspaceError = useCallback((workspaceId: string) => {
		setWorkspaceErrors((prev) => {
			const next = { ...prev };
			delete next[workspaceId];
			return next;
		});
	}, []);

	return (
		<ProfileControlsContext.Provider value={controls}>
			{!isLoadingComplete && <SplashScreen />}
			{workspaces.length > 0 && <ProfileServices />}

			{activeWorkspaceError && (
				<WorkspaceError resetError={handleResetWorkspaceError} />
			)}

			{workspaces.map((workspace) =>
				workspace.touched ? (
					<WorkspaceContext.Provider
						key={workspace.id}
						value={{ profileId, workspaceId: workspace.id }}
					>
						<StatusBarProvider>
							<WorkspaceErrorProvider onError={handleWorkspaceError}>
								<Workspace profile={currentProfile} />
							</WorkspaceErrorProvider>
							<ProfileStatusBar />
						</StatusBarProvider>
					</WorkspaceContext.Provider>
				) : null,
			)}
		</ProfileControlsContext.Provider>
	);
};
