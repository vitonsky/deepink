import React, { useCallback, useMemo, useState } from 'react';
import { FaGear, FaPlus } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import {
	Button,
	Divider,
	HStack,
	Select,
	StackProps,
	Text,
	VStack,
} from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';

import { WorkspaceCreatePopup } from './WorkspaceCreatePopup';

export const WorkspacesPanel = (props: StackProps) => {
	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();

	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);

		telemetry.track(TELEMETRY_EVENT_NAME.SETTINGS_CLICK, { scope: 'workspace' });
	}, [telemetry]);

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
		<VStack w="100%" {...props}>
			<HStack w="100%">
				<Text
					as="h2"
					fontSize=".9rem"
					fontWeight="600"
					gap=".4rem"
					color="typography.secondary"
				>
					Workspaces
				</Text>

				<IconButton
					variant="ghost"
					size="xs"
					marginLeft="auto"
					onClick={() => {
						modal.show({
							content: () => <WorkspaceCreatePopup />,
						});
					}}
					icon={<FaPlus />}
					title="Add workspace"
				/>
			</HStack>

			<Divider />

			<HStack w="100%" marginTop="auto">
				<Select
					size="sm"
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

						telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_SELECTED, {
							totalWorkspacesCount: workspaces.length,
						});
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
