import React, { FC, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Checkbox, HStack, Input, Link, Text, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { ModalScreen } from '@components/ModalScreen/ModalScreen';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { importNotes, selectDirectory } from '@electron/requests/files/renderer';
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
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectWorkspace,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { getPathSegments, joinPathSegments } from '@utils/fs/paths';

import { mkdir, writeFile } from 'fs/promises';
import { useNotesExport } from './useNotesExport';
import { useNotesImport } from './useNotesImport';

export interface WorkspaceSettingsProps {
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ onClose }) => {
	const {
		profile: { db },
	} = useProfileControls();

	const notesImport = useNotesImport();
	const notesExport = useNotesExport();

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
						<VStack w="100%" align="start">
							<HStack>
								<Button
									isDisabled={notesImport.progress !== null}
									onClick={async () => {
										const content = await importNotes();
										await notesImport.importNotes(
											// TODO: update files fetching API
											createFileManagerMock(
												Object.fromEntries(
													Object.entries(content).map(
														([path, buffer]) => [
															'/' + path,
															buffer,
														],
													),
												),
											),
										);

										console.log('Import is completed');
									}}
								>
									Import notes
								</Button>
								<Button
									isDisabled={notesExport.progress !== null}
									onClick={async () => {
										const directories = await selectDirectory();
										if (!directories || directories.length !== 1) {
											console.log('Must be selected one directory');
											return;
										}

										const directory = directories[0];

										const exportTarget = createFileManagerMock();
										await notesExport.exportNotes(exportTarget);

										for (const filePath of await exportTarget.list()) {
											const fileBuffer = await exportTarget.get(
												filePath,
											);
											if (!fileBuffer) continue;

											const fullPath = joinPathSegments([
												directory,
												filePath,
											]);

											console.log('Write file to', fullPath);

											// TODO: remove node usages in frontend code
											await mkdir(
												getPathSegments(fullPath).dirname,
												{ recursive: true },
											);

											await writeFile(
												fullPath,
												Buffer.from(fileBuffer),
											);
										}
									}}
								>
									Export notes
								</Button>
							</HStack>
							{notesImport.progress && (
								<Text>
									Notes import is in progress:{' '}
									{notesImport.progress.stage}{' '}
									{notesImport.progress.total}/
									{notesImport.progress.processed}
								</Text>
							)}
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
