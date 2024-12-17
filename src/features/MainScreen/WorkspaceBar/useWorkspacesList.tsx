import { useCallback, useMemo } from 'react';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';

export const useWorkspacesList = () => {
	const dispatch = useAppDispatch();

	const { profileId } = useWorkspaceData();

	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaces = useAppSelector(selectWorkspaces({ profileId }));

	const update = useCallback(async () => {
		const updatedWorkspaces = await workspacesManager.getList();

		const newWorkspaces = updatedWorkspaces.filter(
			(workspace) => !workspaces.some(({ id }) => id === workspace.id),
		);

		const mergedWorkspaces = structuredClone({
			...Object.fromEntries(
				workspaces.map((workspace) => [workspace.id, workspace]),
			),
			...Object.fromEntries(
				newWorkspaces.map((workspace) => [
					workspace.id,
					{
						id: workspace.id,
						name: workspace.name,

						activeNote: null,
						openedNotes: [],
						notes: [],

						tags: {
							selected: null,
							list: [],
						},
					},
				]),
			),
		});

		// Update names
		updatedWorkspaces.forEach((workspace) => {
			mergedWorkspaces[workspace.id].name = workspace.name;
		});

		// Delete workspaces that no more exists
		for (const id in mergedWorkspaces) {
			const isWorkspaceExists = updatedWorkspaces.some(
				(workspace) => workspace.id === id,
			);
			if (!isWorkspaceExists) {
				delete mergedWorkspaces[id];
			}
		}

		dispatch(
			workspacesApi.setWorkspaces({
				profileId,
				workspaces: mergedWorkspaces,
			}),
		);
	}, [dispatch, profileId, workspaces, workspacesManager]);

	return { workspaces, update };
};
