import { useCallback, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useProfileControls } from '@features/App/Profile';
import { useWorkspaceContext } from '@features/App/Workspace';
import { ActionCreatorWithPayload, Selector } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';
import { RootState } from '../store';
import {
	ProfileData,
	selectProfile,
	selectWorkspace,
	WorkspaceData,
	workspacesApi,
} from './profiles';

export const useWorkspaceData = () => {
	const { profileId, workspaceId } = useWorkspaceContext();
	return useMemo(() => ({ profileId, workspaceId }), [profileId, workspaceId]);
};

// Select profile and workspace from context
export const useWorkspaceRootSelector = () => {
	const { profileId, workspaceId } = useWorkspaceData();

	return useMemo(
		() => selectWorkspace({ profileId, workspaceId }),
		[profileId, workspaceId],
	);
};

export const useWorkspaceSelector = <T>(
	selector: Selector<WorkspaceData | null, T>,
): T => {
	const selectWorkspace = useWorkspaceRootSelector();
	return useAppSelector((state) => selector(selectWorkspace(state)), isEqual);
};

export const useVaultSelector = <T>(selector: Selector<ProfileData | null, T>): T => {
	const {
		profile: {
			profile: { id: profileId },
		},
	} = useProfileControls();

	const composedSelector = useCallback(
		(state: RootState) => {
			const selectConfiguredProfile = selectProfile({ profileId });
			const profile = selectConfiguredProfile(state);
			return selector(profile);
		},
		[profileId, selector],
	);

	return useAppSelector(composedSelector, isEqual);
};

type StripPropsInActionCreator<T, StripPropsSignature extends {}> = {
	[K in keyof T as T[K] extends ActionCreatorWithPayload<
		StripPropsSignature & infer _P,
		infer _
	>
		? K
		: never]: T[K] extends ActionCreatorWithPayload<
		StripPropsSignature & infer P,
		infer N
	>
		? ActionCreatorWithPayload<Omit<P, keyof StripPropsSignature>, N>
		: never;
};

export const useVaultActions = () => {
	const {
		profile: {
			profile: { id: profileId },
		},
	} = useProfileControls();

	return useMemo(() => {
		return Object.fromEntries(
			Object.entries(workspacesApi).map(([key, action]) => [
				key,
				(props: Record<any, any>) => action({ profileId, ...props } as any),
			]),
		) as unknown as StripPropsInActionCreator<
			typeof workspacesApi,
			{ profileId: string }
		>;
	}, [profileId]);
};
