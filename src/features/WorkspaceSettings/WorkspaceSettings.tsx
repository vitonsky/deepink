import React, { FC, useCallback, useMemo } from 'react';
import Dropzone from 'react-dropzone';
import { useForm } from 'react-hook-form';
import {
	Button,
	Divider,
	HStack,
	Input,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Spinner,
	Switch,
	Text,
	VStack,
} from '@chakra-ui/react';
import { CalmButton } from '@components/CalmButton';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import {
	useAttachmentsController,
	useFilesController,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspacesList } from '@features/MainScreen/WorkspacesPanel/useWorkspacesList';
import {
	WorkspaceCreatePopup,
	workspacePropsValidator,
} from '@features/MainScreen/WorkspacesPanel/WorkspaceCreatePopup';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDirectoryPicker } from '@hooks/files/useDirectoryPicker';
import { useFilesPicker } from '@hooks/files/useFilesPicker';
import {
	importOptions,
	ImportTypes,
	useImportNotesPreset,
} from '@hooks/notes/useImportNotesPreset';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
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
	const telemetry = useTelemetryTracker();

	const {
		profile: { db },
	} = useProfileControls();

	const {
		importFiles,
		progress: importProgress,
		abort: abortImport,
	} = useImportNotesPreset();
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

					await importFiles('directory', Array.from(files));
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
		<Modal
			isOpen
			onClose={() => {
				onClose?.();
			}}
			size="4xl"
		>
			<ModalOverlay />
			<ModalContent w="780px">
				<ModalHeader>Workspace settings</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack
						w="100%"
						minH="100%"
						paddingBottom="2rem"
						justifyContent="center"
					>
						<Features>
							<FeaturesGroup>
								<FeaturesOption title="Workspace name">
									<HStack
										as="form"
										onSubmit={workspaceNameForm.handleSubmit(
											async ({ name }) => {
												if (!workspaceData) return;

												await workspacesManager.update(
													workspaceData.id,
													{
														name,
													},
												);

												await workspaces.update();
											},
										)}
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
											{
												workspaceNameForm.formState.errors.name
													.message
											}
										</Text>
									)}
								</FeaturesOption>

								<Divider />

								<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
									<Switch size="sm">Enable history for notes</Switch>
								</FeaturesOption>

								<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
									<Switch size="sm">Use recycle bin</Switch>
								</FeaturesOption>
							</FeaturesGroup>

							<FeaturesGroup title="Data migration">
								<FeaturesOption description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app">
									<HStack>
										<Menu size="sm">
											<MenuButton
												size="sm"
												as={CalmButton}
												isDisabled={importProgress !== null}
											>
												Import notes
											</MenuButton>
											<MenuList>
												{importOptions.map((option) => (
													<MenuItem
														key={option.type}
														onClick={() =>
															onClickImport(option.type)
														}
													>
														<Text>{option.text}</Text>
													</MenuItem>
												))}
											</MenuList>
										</Menu>

										<Button
											size="sm"
											isDisabled={notesExport.progress !== null}
											onClick={async () => {
												await notesExport.exportNotes(
													buildFileName(
														workspaceData?.name,
														'backup',
													),
												);
											}}
										>
											Export notes
										</Button>
									</HStack>
								</FeaturesOption>

								<FeaturesOption>
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
										{({
											getRootProps,
											getInputProps,
											isDragActive,
										}) => (
											<VStack
												{...getRootProps()}
												gap="1rem"
												as="section"
												border="1px dashed"
												backgroundColor="dim.50"
												borderColor={
													isDragActive ? 'dim.400' : 'dim.200'
												}
												borderWidth="2px"
												borderRadius="2px"
												padding="1rem"
												opacity={
													importProgress === null ? 1 : 0.6
												}
											>
												<input {...getInputProps()} />
												<Text>
													Drop Markdown files or .zip archive to
													import
												</Text>
												<Text color="typography.secondary">
													Drag & Drop some files here, or click
													to select files
												</Text>
											</VStack>
										)}
									</Dropzone>

									{importProgress && (
										<HStack w="100%" align="start">
											<Spinner size="sm" />
											<Text>
												Notes import is in progress. Stage:{' '}
												{importProgress.stage}{' '}
												{importProgress.processed}/
												{importProgress.total}
											</Text>
										</HStack>
									)}
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
											It is not possible to delete last workspace in
											profile.{' '}
											<Link
												href="#"
												onClick={() => {
													modal.show({
														content: () => (
															<WorkspaceCreatePopup />
														),
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
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
