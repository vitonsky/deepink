import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, Button, Divider, Input, Select, Text, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectActiveWorkspaceInfo,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { useProfileControls } from '../Profile';

export const WorkspaceErrorScreen = ({
	onWorkspaceErrorReset,
}: {
	onWorkspaceErrorReset: (workspaceId: string) => void;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const dispatch = useAppDispatch();
	const telemetry = useTelemetryTracker();
	const {
		close: profileClose,
		profile: {
			db,
			profile: { id: profileId },
		},
	} = useProfileControls();

	const workspaces = useAppSelector(selectWorkspacesInfo({ profileId }));
	const currentWorkspace = useAppSelector(selectActiveWorkspaceInfo({ profileId }));

	const [newWorkspaceName, setNewWorkspaceName] = useState('');
	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);
	const [isPending, setIsPending] = useState(false);

	if (!currentWorkspace) return;

	return (
		<Box
			flexDirection="column"
			flexGrow="100"
			width="100%"
			height="100vh"
			backgroundColor="surface.background"
		>
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<VStack maxW="400px" minW="350px" gap="2rem">
					<Text fontSize="1.3rem" fontWeight="bold">
						{t('workspace.error.title', { name: currentWorkspace.name })}
					</Text>

					<Text color="typography.base">
						{t('workspace.error.description')}
					</Text>

					<VStack
						alignItems="start"
						w="100%"
						color="typography.additional"
						gap="0.5rem"
					>
						<Text>{t('workspace.error.chooseAnother')}</Text>

						<Select
							size="sm"
							marginTop="auto"
							borderRadius="6px"
							value={currentWorkspace.id}
							onChange={(evt) => {
								onWorkspaceErrorReset(currentWorkspace.id);

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
									{workspace.name}
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
						<Text>{t('workspace.error.createNew')}</Text>
						<form
							style={{ width: '100%' }}
							onSubmit={(event) => {
								event.preventDefault();
								if (isPending || !newWorkspaceName.trim()) return;

								setIsPending(true);

								workspacesManager
									.create({ name: newWorkspaceName })
									.then(async (workspaceId) => {
										await db.sync();

										const updatedWorkspaces =
											await workspacesManager.getList();
										dispatch(
											workspacesApi.updateWorkspacesList({
												profileId,
												workspaces: updatedWorkspaces,
												newNoteTemplate: t(
													'note.title.defaultTemplate',
													{ date: '{date:D MMM YYYY, HH:mm}' },
												),
											}),
										);

										onWorkspaceErrorReset(currentWorkspace.id);

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
							<VStack w="100%">
								<Input
									placeholder="e.g., Personal"
									isDisabled={isPending}
									value={newWorkspaceName}
									onChange={(e) => setNewWorkspaceName(e.target.value)}
								/>
								<Button w="100%" isDisabled={isPending} type="submit">
									{t('workspace.error.createWorkspace')}
								</Button>
							</VStack>
						</form>
					</VStack>

					<Divider />

					<VStack
						alignItems="start"
						w="100%"
						gap="0.5rem"
						color="typography.additional"
					>
						<Button w="100%" onClick={() => profileClose()}>
							<Text>{t('workspace.error.closeVault')}</Text>
						</Button>
					</VStack>
				</VStack>
			</Box>
		</Box>
	);
};
