import React, { useMemo } from 'react';
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
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { useModalWindowApi } from '@features/ModalWindow/useModalWindow';
import { PropertiesForm } from '@features/NoteEditor/RichEditor/plugins/ContextMenu/components/ObjectPropertiesEditor';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { useWorkspacesList } from './useWorkspacesList';

export const workspacePropsValidator = z.object({
	name: z.string().min(1, 'Name must not be empty'),
});

export const WorkspaceCreatePopup = () => {
	const dispatch = useAppDispatch();

	const { onClose } = useModalWindowApi();

	const { profileId } = useWorkspaceData();

	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

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
								onClose();

								workspacesManager
									.create({ name })
									.then(async (workspaceId) => {
										await updateWorkspaces();

										dispatch(
											workspacesApi.setActiveWorkspace({
												workspaceId,
												profileId,
											}),
										);
									});
							}}
							submitButtonText="Add"
							cancelButtonText="Cancel"
							onCancel={onClose}
						/>
					</Box>
				</VStack>
			</ModalBody>
		</>
	);
};
