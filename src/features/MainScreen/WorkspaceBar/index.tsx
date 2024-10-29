import React, { useCallback, useMemo, useState } from 'react';
import { FaGear } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import { Button, HStack, Select } from '@chakra-ui/react';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces } from '@state/redux/profiles/profiles';

export const WorkspaceBar = () => {
	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);
	}, []);

	const { profileId } = useWorkspaceData();

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
					variant="primary"
					defaultValue="default"
					borderRadius="6px"
				>
					{workspaces.map((workspace) => (
						<option key={workspace.id} value={workspace.id}>
							{workspace.content}
						</option>
					))}
				</Select>
				<Button
					size="sm"
					variant="primary"
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
