import React, { useMemo, useState } from 'react';
import { createSelector } from 'reselect';
import { Box, Button, Divider, Input, Select, Text, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectActiveWorkspaceInfo,
	selectWorkspaces,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { useProfileControls } from '../Profile';

export const WorkspaceError = ({ resetError }: { resetError: () => void }) => {
	const dispatch = useAppDispatch();
	const telemetry = useTelemetryTracker();
	const profileControls = useProfileControls();

	const profileId = profileControls.profile.profile.id;

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
	const currentWorkspace = useAppSelector(selectActiveWorkspaceInfo({ profileId }));

	const [workspaceName, setWorkspaceName] = useState('');
	const {
		profile: { db },
	} = useProfileControls();
	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const [isPending, setIsPending] = useState(false);

	return (
		<Box
			sx={{
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
				height: '100vh',
				maxWidth: '100%',
				maxHeight: '100%',
				backgroundColor: 'surface.background',
			}}
		>
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<VStack maxW="400px" minW="350px" gap="2rem">
					<Text fontSize="1.3rem" fontWeight="bold">
						Workspace "{currentWorkspace?.name}" failed to load
					</Text>

					<Text color="typography.base">
						Something went wrong while loading workspace. The workspace data
						may be corrupted. Switch to another workspace or create a new one
						to continue.
					</Text>

					<VStack
						alignItems="start"
						w="100%"
						color="typography.additional"
						gap="0.5rem"
					>
						<Text>Choose another workspace</Text>

						<Select
							size="sm"
							marginTop="auto"
							borderRadius="6px"
							value={currentWorkspace?.id}
							onChange={(evt) => {
								resetError();

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
					</VStack>

					<Divider />

					<VStack
						alignItems="start"
						w="100%"
						color="typography.additional"
						gap="0.5rem"
					>
						<Text>Create a new workspace</Text>
						<VStack w="100%">
							<Input
								placeholder="e.g., Personal"
								value={workspaceName}
								onChange={(e) => setWorkspaceName(e.target.value)}
							/>
							<Button
								w="100%"
								isLoading={isPending}
								onClick={() => {
									if (isPending || !workspaceName.trim()) return;

									resetError();

									setIsPending(true);

									workspacesManager
										.create({ name: workspaceName })
										.then(async (workspaceId) => {
											await db.sync();

											const updatedWorkspaces =
												await workspacesManager.getList();
											dispatch(
												workspacesApi.updateWorkspacesList({
													profileId,
													workspaces: updatedWorkspaces,
												}),
											);

											dispatch(
												workspacesApi.setActiveWorkspace({
													workspaceId,
													profileId,
												}),
											);

											telemetry.track(
												TELEMETRY_EVENT_NAME.WORKSPACE_ADDED,
											);
										})
										.finally(() => {
											setIsPending(false);
										});
								}}
							>
								Create workspace
							</Button>
						</VStack>
					</VStack>

					<Divider />

					<VStack
						alignItems="start"
						w="100%"
						gap="0.5rem"
						color="typography.additional"
					>
						<Button w="100%" onClick={() => profileControls.close()}>
							<Text>Close current vault</Text>
						</Button>
					</VStack>
				</VStack>
			</Box>
		</Box>
	);
};
