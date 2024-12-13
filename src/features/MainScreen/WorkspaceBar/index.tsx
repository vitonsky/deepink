import React, { useCallback, useMemo, useState } from 'react';
import { FaGear } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import { Button, HStack, Select } from '@chakra-ui/react';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';

export const WorkspaceBar = () => {
	const dispatch = useAppDispatch();

	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);
	}, []);

	const { profileId, workspaceId } = useWorkspaceData();

	const selectWorkspacesWithMemo = useMemo(
		() =>
			createSelector([selectWorkspaces({ profileId })], (workspaces) =>
				workspaces.map((workspace) => ({
					id: workspace.id,
					content: workspace.name,
				})),
			),
		[profileId],
	);
	const workspaces = useAppSelector(selectWorkspacesWithMemo);

	return (
		<>
			<HStack w="100%" marginTop="auto">
				<Select
					size="sm"
					variant="secondary"
					borderRadius="6px"
					value={workspaceId}
					onChange={(evt) => {
						dispatch(
							workspacesApi.setActiveWorkspace({
								profileId,
								workspaceId: evt.target.value,
							}),
						);
					}}
				>
					{workspaces.map((workspace) => (
						<option key={workspace.id} value={workspace.id}>
							{workspace.content}
						</option>
					))}
				</Select>
				<Button
					size="sm"
					variant="secondary"
					title="Workspace settings"
					onClick={editWorkspace}
				>
					<FaGear />
				</Button>
			</HStack>

			<WorkspaceSettings
				isVisible={isWorkspaceEditing}
				onClose={() => setIsWorkspaceEditing(false)}
			/>
		</>
	);
};
