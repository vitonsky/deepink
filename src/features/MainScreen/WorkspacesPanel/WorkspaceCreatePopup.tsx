import React, { useMemo, useState } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { z } from 'zod';
import {
	Box,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	Text,
	VStack,
} from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { PropertiesForm } from '@features/NoteEditor/RichEditor/plugins/ContextMenu/components/ObjectPropertiesEditor';
import { useTelemetryTracker } from '@features/telemetry';
import { useModalApi } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { useWorkspacesList } from './useWorkspacesList';

export const workspacePropsValidator = z.object({
	name: z.string().min(1, 'Name must not be empty'),
});

export const WorkspaceCreatePopup = () => {
	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();

	const { onClose } = useModalApi();

	const { profileId } = useWorkspaceData();

	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const [isPending, setIsPending] = useState(false);

	const { update: updateWorkspaces } = useWorkspacesList();

	return (
		<>
			<ModalCloseButton />
			<ModalHeader>
				<Text>Add new workspace</Text>
			</ModalHeader>
			<ModalBody paddingBottom="1rem">
				<VStack w="100%" gap="2rem" align="start">
					<Text color="typography.secondary">
						Create a new workspace to manage your notes even better. Separate
						your notes by scope.
					</Text>

					<Box as={AutoFocusInside} w="100%">
						<PropertiesForm
							options={[
								{
									id: 'name',
									value: '',
									label: 'Workspace name',
									placeholder: 'e.g., Personal',
								},
							]}
							validatorScheme={workspacePropsValidator}
							onUpdate={({ name }) => {
								setIsPending(true);

								workspacesManager
									.create({ name })
									.then(async (workspaceId) => {
										// Synchronize immediately after creation to prevent workspace loss
										// if the user closes the app before the next automatic sync
										await db.sync();

										onClose();
										await updateWorkspaces();

										setIsPending(false);

										dispatch(
											workspacesApi.setActiveWorkspace({
												workspaceId,
												profileId,
											}),
										);

										telemetry.track(
											TELEMETRY_EVENT_NAME.WORKSPACE_ADDED,
										);
									});
							}}
							submitButtonText="Add"
							cancelButtonText="Cancel"
							onCancel={onClose}
							isPending={isPending}
						/>
					</Box>
				</VStack>
			</ModalBody>
		</>
	);
};
