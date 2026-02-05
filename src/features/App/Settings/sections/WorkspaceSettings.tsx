import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
	Button,
	Divider,
	HStack,
	Input,
	Link,
	Select,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useWorkspacesList } from '@features/MainScreen/WorkspacesPanel/useWorkspacesList';
import {
	WorkspaceCreatePopup,
	workspacePropsValidator,
} from '@features/MainScreen/WorkspacesPanel/WorkspaceCreatePopup';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateProcessor } from '@hooks/notes/TemplateProcessor';
import { useImportNotesPreset } from '@hooks/notes/useImportNotesPreset';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectNewNoteTemplate,
	selectWorkspace,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { useProfileControls } from '../../Profile';
import {
	useAttachmentsController,
	useFilesController,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '../../Workspace/WorkspaceProvider';

export const WorkspaceSettings = () => {
	const newNoteConfig = useWorkspaceSelector(selectNewNoteTemplate);

	const telemetry = useTelemetryTracker();

	const {
		profile: { db },
	} = useProfileControls();

	const { abort: abortImport } = useImportNotesPreset();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaceInfo = useWorkspaceSelector(selectWorkspaceName);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const workspaceNameForm = useForm({
		defaultValues: {
			name: workspaceData?.name ?? '',
		},
		resolver: zodResolver(workspacePropsValidator),
	});

	const dispatch = useAppDispatch();
	const workspaces = useWorkspacesList();

	const notes = useNotesRegistry();
	const tags = useTagsRegistry();
	const files = useFilesRegistry();
	const filesController = useFilesController();
	const attachments = useAttachmentsController();

	const isOtherWorkspacesExists = workspaces.workspaces.length > 1;
	const onDelete = useCallback(async () => {
		const nextWorkspace = workspaces.workspaces.find(
			(workspace) => workspace.id !== currentWorkspace.workspaceId,
		);
		if (!nextWorkspace) return;

		const isConfirmed = confirm(
			`You are about to delete workspace "${workspaceInfo.name}". Are you sure you want to do it?\n\nIf you will continue, all data related to this workspace will be deleted, including notes, tags and files.`,
		);

		telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_DELETE_CLICK, {
			confirmed: isConfirmed ? 'yes' : 'no',
		});
		if (!isConfirmed) return;

		// TODO: emit event and react on it
		// Abort any operations in workspace
		abortImport(new Error('Workspace deletion is in progress'));

		const tagsList = await tags.getTags();
		const notesList = await notes.get();

		await notes.delete(notesList.map((note) => note.id));
		await Promise.all(tagsList.map((note) => tags.delete(note.id)));

		await files
			.query()
			.then((filesList) => files.delete(filesList.map((file) => file.id)));
		await filesController.delete([currentWorkspace.workspaceId]);

		await new FilesIntegrityController(
			currentWorkspace.workspaceId,
			filesController,
			{ files, attachments },
		).fixAll();

		dispatch(
			workspacesApi.setActiveWorkspace({
				workspaceId: nextWorkspace.id,
				profileId: currentWorkspace.profileId,
			}),
		);

		await workspacesManager.delete([currentWorkspace.workspaceId]);
		await workspaces.update();
	}, [
		abortImport,
		attachments,
		currentWorkspace.profileId,
		currentWorkspace.workspaceId,
		dispatch,
		files,
		filesController,
		notes,
		tags,
		telemetry,
		workspaceInfo.name,
		workspaces,
		workspacesManager,
	]);

	const modal = useWorkspaceModal();

	return (
		<Features>
			<FeaturesGroup>
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
							size="sm"
						/>
						<Button variant="accent" type="submit" size="sm">
							Update
						</Button>
					</HStack>
					{workspaceNameForm.formState.errors.name && (
						<Text color="message.error">
							{workspaceNameForm.formState.errors.name.message}
						</Text>
					)}
				</FeaturesOption>

				<Divider />

				<FeaturesOption
					title="New note title"
					description={
						<>
							{
								'Set title for a new notes. You may use date via syntax {date} or {date:FORMAT} like that {date:DD/MM/YYYY HH:mm}.'
							}
							<br />
							For more syntax, refer to{' '}
							<Link href="https://day.js.org/docs/en/display/format">
								format reference
							</Link>
							.
						</>
					}
				>
					<Input
						size="sm"
						placeholder="e.g., Note {date:DD/MM/YYYY HH:mm}"
						value={newNoteConfig.title}
						onChange={(evt) => {
							dispatch(
								workspacesApi.setWorkspaceNoteTemplateConfig({
									...currentWorkspace,
									title: evt.target.value,
								}),
							);
						}}
					/>

					{newNoteConfig.title.trim().length > 0 && (
						<VStack align="start" gap={0}>
							<Text fontSize=".8rem">Example</Text>
							<Text fontWeight="bold">
								{new TemplateProcessor({
									ignoreParsingErrors: true,
								}).compile(newNoteConfig.title)}
							</Text>
						</VStack>
					)}
				</FeaturesOption>
				<FeaturesOption title="Tags for new note">
					<Select
						size="sm"
						width="auto"
						value={newNoteConfig.tags}
						onChange={(evt) => {
							const { value } = evt.target;
							if (value === 'none' || value === 'selected') {
								dispatch(
									workspacesApi.setWorkspaceNoteTemplateConfig({
										...currentWorkspace,
										tags: value,
									}),
								);
							}
						}}
					>
						<option value="none">Do not set any tags</option>
						<option value="selected">Same as selected tag</option>
					</Select>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Dangerous zone">
				<FeaturesOption description="Delete workspace and all related data, including notes, tags and files">
					<Button
						size="sm"
						variant="accent"
						colorScheme="alert"
						onClick={onDelete}
						isDisabled={!isOtherWorkspacesExists}
					>
						Delete workspace
					</Button>

					{!isOtherWorkspacesExists && (
						<Text>
							It is not possible to delete last workspace in profile.{' '}
							<Link
								href="#"
								onClick={() => {
									modal.show({
										content: () => <WorkspaceCreatePopup />,
									});
								}}
							>
								Create
							</Link>{' '}
							another workspace first.
						</Text>
					)}
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
