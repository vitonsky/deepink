import React, { FC, useCallback, useMemo } from 'react';
import Dropzone from 'react-dropzone';
import { useForm } from 'react-hook-form';
import {
	Box,
	Button,
	Checkbox,
	HStack,
	Input,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Spinner,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { ModalScreen } from '@components/ModalScreen/ModalScreen';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import {
	useAttachmentsController,
	useFilesController,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspacesList } from '@features/MainScreen/WorkspaceBar/useWorkspacesList';
import {
	WorkspaceCreatePopup,
	workspacePropsValidator,
} from '@features/MainScreen/WorkspaceBar/WorkspaceCreatePopup';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDirectoryPicker } from '@hooks/files/useDirectoryPicker';
import { useFilesPicker } from '@hooks/files/useFilesPicker';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectWorkspace,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { importOptions, ImportTypes, useImportNotesPreset } from './useImportNotesPreset';
import { getExportArchiveName, useNotesExport } from './useNotesExport';

export interface WorkspaceSettingsProps {
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ onClose }) => {
	const {
		profile: { db },
	} = useProfileControls();

	const { importFiles, progress: importProgress } = useImportNotesPreset();
	const notesExport = useNotesExport();

	const selectDirectory = useDirectoryPicker();
	const selectFiles = useFilesPicker();

	const onClickImport = useCallback(
		async (type: ImportTypes) => {
			// NotesImporterOptions
			switch (type) {
				case 'zip': {
					const files = await selectFiles({
						accept: '.zip',
					});
					if (!files || files.length !== 1) return;

					await importFiles('zip', Array.from(files));
					break;
				}
				case 'directory': {
					const files = await selectDirectory();
					if (!files || files.length === 0) return;

					await importFiles('zip', Array.from(files));
					break;
				}
			}
		},
		[importFiles, selectDirectory, selectFiles],
	);

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
		if (!isConfirmed) return;

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
		attachments,
		currentWorkspace.profileId,
		currentWorkspace.workspaceId,
		dispatch,
		files,
		filesController,
		notes,
		tags,
		workspaceInfo.name,
		workspaces,
		workspacesManager,
	]);

	const modal = useWorkspaceModal();

	return (
		<ModalScreen isVisible onClose={onClose} title="Workspace settings">
			<VStack w="100%" minH="100%" p="2rem" justifyContent="center">
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
						<VStack w="100%" align="start">
							<HStack>
								<Menu>
									<MenuButton
										as={Button}
										isDisabled={importProgress !== null}
									>
										Import notes
									</MenuButton>
									<MenuList>
										{importOptions.map((option) => (
											<MenuItem
												key={option.type}
												onClick={() => onClickImport(option.type)}
											>
												<Text>{option.text}</Text>
											</MenuItem>
										))}
									</MenuList>
								</Menu>
								<Button
									isDisabled={notesExport.progress !== null}
									onClick={async () => {
										await notesExport.exportNotes(
											true,
											getExportArchiveName(workspaceData?.name),
										);
									}}
								>
									Export notes
								</Button>
							</HStack>
							{importProgress && (
								<HStack w="100%" align="start">
									<Spinner size="sm" />
									<Text>
										Notes import is in progress. Stage:{' '}
										{importProgress.stage} {importProgress.total}/
										{importProgress.processed}
									</Text>
								</HStack>
							)}

							<Dropzone
								onDrop={async (files) => {
									if (files.length === 0) return;

									// Import zip file
									if (
										files.length === 1 &&
										files[0].name.endsWith('.zip')
									) {
										await importFiles('zip', files);
										return;
									}

									// Import markdown files
									await importFiles('directory', files);
								}}
								disabled={importProgress !== null}
							>
								{({ getRootProps, getInputProps, isDragActive }) => (
									<Box
										as="section"
										border="1px dashed"
										backgroundColor="dim.50"
										borderColor={isDragActive ? 'dim.400' : 'dim.100'}
										borderWidth="2px"
										borderRadius="2px"
										padding="1rem"
										opacity={importProgress === null ? 1 : 0.6}
									>
										<VStack {...getRootProps()} gap="1rem">
											<input {...getInputProps()} />
											<Text>
												Drop Markdown files or .zip archive to
												import
											</Text>
											<Text color="typography.secondary">
												Drag & Drop some files here, or click to
												select files
											</Text>
										</VStack>
									</Box>
								)}
							</Dropzone>
						</VStack>
					</FeaturesOption>

					<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
						<Checkbox>Enable history for notes</Checkbox>
					</FeaturesOption>

					<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
						<Checkbox>Use recycle bin</Checkbox>
					</FeaturesOption>

					<FeaturesHeader view="section">Dangerous zone</FeaturesHeader>

					<FeaturesOption description="Delete workspace and all related data, including notes, tags and files">
						<Button
							variant="primary"
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
				</Features>
			</VStack>
		</ModalScreen>
	);
};
