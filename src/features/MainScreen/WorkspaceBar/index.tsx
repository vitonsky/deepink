import React, { useCallback, useMemo, useState } from 'react';
import { FaGear, FaPlus } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import { Button, Divider, HStack, Select, Text, VStack } from '@chakra-ui/react';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';

import { WorkspaceCreatePopup } from './WorkspaceCreatePopup';

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

	const modal = useWorkspaceModal();

	return (
		<VStack w="100%">
			<HStack w="100%">
				<Text
					as="h2"
					fontWeight="bold"
					fontSize="16px"
					color="typography.secondary"
				>
					Workspaces
				</Text>

				<Button
					variant="ghost"
					size="xs"
					marginLeft="auto"
					onClick={() => {
						modal.show({
							content: () => <WorkspaceCreatePopup />,
						});
					}}
				>
					<FaPlus />
				</Button>
			</HStack>

			<Divider />

			<HStack w="100%" marginTop="auto">
				<Select
					size="sm"
					variant="secondary"
					borderRadius="6px"
					value={workspaceId}
					onChange={(evt) => {
						const workspaceId = evt.target.value;
						dispatch(
							workspacesApi.setActiveWorkspace({
								profileId,
								workspaceId,
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

			{isWorkspaceEditing && (
				<WorkspaceSettings onClose={() => setIsWorkspaceEditing(false)} />
			)}
		</VStack>
	);
};
