import React, { FC, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Checkbox, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { ModalScreen } from '@components/ModalScreen/ModalScreen';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import {
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspacesList } from '@features/MainScreen/WorkspaceBar/useWorkspacesList';
import { workspacePropsValidator } from '@features/MainScreen/WorkspaceBar/WorkspaceCreatePopup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectWorkspace,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';

export interface WorkspaceSettingsProps {
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ onClose }) => {
	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaceInfo = useWorkspaceSelector(selectWorkspaceName);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const workspaceNameForm = useForm({
		defaultValues: {
			name: workspaceData?.name,
		},
		resolver: zodResolver(workspacePropsValidator),
	});

	const dispatch = useAppDispatch();
	const workspaces = useWorkspacesList();

	const notes = useNotesRegistry();
	const tags = useTagsRegistry();
	const files = useFilesRegistry();

	// TODO: prevent deletion for last workspace, or create new workspace
	const onDelete = useCallback(async () => {
		const nextWorkspace = workspaces.workspaces.find(
			(workspace) => workspace.id !== currentWorkspace.workspaceId,
		);
		if (!nextWorkspace) return;

		const isConfirmed = confirm(
			`You are about to delete workspace "${workspaceInfo.name}". Are you sure you want to do it?\n\nIf you will continue, all data related to this workspace will be deleted, including notes, tags and files.`,
		);
		if (!isConfirmed) return;

		const tagsList = await tags.getTags();
		const notesList = await notes.get();

		await notes.delete(notesList.map((note) => note.id));
		await Promise.all(tagsList.map((note) => tags.delete(note.id)));
		await files.clearOrphaned();

		dispatch(
			workspacesApi.setActiveWorkspace({
				workspaceId: nextWorkspace.id,
				profileId: currentWorkspace.profileId,
			}),
		);

		await workspacesManager.delete([currentWorkspace.workspaceId]);
		await workspaces.update();
	}, [
		currentWorkspace.profileId,
		currentWorkspace.workspaceId,
		dispatch,
		files,
		notes,
		tags,
		workspaces,
		workspacesManager,
	]);

	return (
		<ModalScreen isVisible onClose={onClose} title="Workspace settings">
			<VStack w="100%" minH="100%" p="2rem 5rem" justifyContent="center">
				<Features>
					<FeaturesOption title="Workspace name">
						<HStack
							as="form"
							onSubmit={workspaceNameForm.handleSubmit(async ({ name }) => {
								if (!workspaceData) return;

								await workspacesManager.update(workspaceData.id, {
									name,
								});

								await workspaces.update();
							})}
						>
							<Input
								{...workspaceNameForm.register('name')}
								placeholder="e.g., Personal"
								flex="100"
							/>
							<Button variant="primary" type="submit">
								Update
							</Button>
						</HStack>
						{workspaceNameForm.formState.errors.name && (
							<Text color="message.error">
								{workspaceNameForm.formState.errors.name.message}
							</Text>
						)}
					</FeaturesOption>

					<FeaturesHeader view="section">Notes management</FeaturesHeader>

					<FeaturesOption description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app">
						<HStack>
							<Button>Import notes</Button>
							<Button>Export notes</Button>
						</HStack>
					</FeaturesOption>

					<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
						<Checkbox>Enable history for notes</Checkbox>
					</FeaturesOption>

					<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
						<Checkbox>Use recycle bin</Checkbox>
					</FeaturesOption>

					<FeaturesHeader view="section">Dangerous zone</FeaturesHeader>

					<FeaturesOption description="Delete workspace with all notes, tags and files">
						<Button variant="primary" colorScheme="alert" onClick={onDelete}>
							Delete workspace
						</Button>
					</FeaturesOption>
				</Features>
			</VStack>
		</ModalScreen>
	);
};
