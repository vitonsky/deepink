import React, { Fragment, useCallback, useMemo, useState } from 'react';
import Dropzone from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { getAbout } from 'src/about';
import {
	Box,
	Button,
	Divider,
	HStack,
	Input,
	InputGroup,
	InputRightElement,
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
	Select,
	Spinner,
	Switch,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
} from '@chakra-ui/react';
import { CalmButton } from '@components/CalmButton';
import { Features } from '@components/Features/Features';
import { FeaturesGroup, FeaturesPanel } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useWorkspacesList } from '@features/MainScreen/WorkspacesPanel/useWorkspacesList';
import {
	WorkspaceCreatePopup,
	workspacePropsValidator,
} from '@features/MainScreen/WorkspacesPanel/WorkspaceCreatePopup';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { GLOBAL_COMMANDS, SHORTCUT_NAMES } from '@hooks/commands';
import { shortcuts } from '@hooks/commands/shortcuts';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
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
import { selectEditorConfig } from '@state/redux/settings/selectors/preferences';
import {
	EditorMode,
	selectEditorMode,
	selectTheme,
	settingsApi,
} from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { useProfileControls } from '../Profile';
import {
	useAttachmentsController,
	useFilesController,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '../Workspace/WorkspaceProvider';
import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

// TODO: implement recording view
export const KeyboardShortcut = ({ shortcut }: { shortcut?: string }) => {
	const keys = useMemo(() => {
		if (!shortcut) return [];

		const isMacOS = navigator.userAgent.includes('Mac OS');
		return shortcut
			.split('+')
			.map((k) => k.trim().replaceAll(/cmdorctrl/gi, isMacOS ? 'Cmd' : 'Ctrl'))
			.filter(Boolean);
	}, [shortcut]);

	// TODO: use icons for some buttons
	return (
		<Box
			padding={'.2rem .5rem'}
			fontSize={'.8rem'}
			backgroundColor={'dim.200'}
			borderRadius={'6px'}
			cursor={'default'}
			userSelect={'none'}
		>
			{keys.length > 0 ? keys.join(' + ') : 'Blank'}
		</Box>
	);
};

// TODO: add icons
const tabs = [
	{
		id: 'Hotkeys',
		content: <Text>Hotkeys</Text>,
	},
	{
		id: 'General',
		content: <Text>General</Text>,
	},
	{
		id: 'appearance',
		content: <Text>Appearance</Text>,
	},
	{
		id: 'vault',
		content: <Text>Vault</Text>,
	},
	{
		id: 'Notes',
		content: <Text>Notes</Text>,
	},
];

const workspaceTabs = [
	{
		id: 'Workspace Settings',
		content: <Text>Workspace Settings</Text>,
	},
	{
		id: 'Import & Export',
		content: <Text>Import & Export</Text>,
	},
];

// TODO: add help section with links
// TODO: add section with workspace settings
// TODO: move panels to separate components
// TODO: connect controls to a data and make changes
// TODO: use range selectors instead of numbers for options with limited range of values
// TODO: suggest available fonts
// TODO: add sync targets list
export const SettingsWindow = () => {
	const editorMode = useAppSelector(selectEditorMode);

	const theme = useAppSelector(selectTheme);
	const editorConfig = useAppSelector(selectEditorConfig);

	const [isOpen, setIsOpen] = useState(true);

	useCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
		setIsOpen(true);
	});

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
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			size="4xl"
			closeOnEsc={false}
		>
			<ModalOverlay />
			<ModalContent maxWidth={'800px'}>
				<ModalHeader paddingInline={'1rem'}>Preferences</ModalHeader>
				<ModalCloseButton />
				<ModalBody paddingInline={'1rem'} paddingBlockEnd={'2rem'}>
					<Tabs orientation="vertical" gap="1rem">
						<TabList
							display="flex"
							flexWrap="wrap"
							width={'200px'}
							gap="1px"
							flexShrink={0}
						>
							{tabs.map((tab) => {
								return (
									<Tab
										key={tab.id}
										justifyContent={'start'}
										borderRadius={'4px'}
										padding=".3rem .5rem"
									>
										{tab.content}
									</Tab>
								);
							})}

							<Text fontWeight={'bold'} marginTop={'2rem'}>
								Workspace
							</Text>
							{workspaceTabs.map((tab) => {
								return (
									<Tab
										key={tab.id}
										justifyContent={'start'}
										borderRadius={'4px'}
										padding=".3rem .5rem"
									>
										{tab.content}
									</Tab>
								);
							})}
						</TabList>

						<TabPanels maxWidth="600px" minWidth="400px" width="100%">
							<TabPanel padding={0}>
								<Features>
									<FeaturesPanel padding={'1rem'}>
										{Object.entries(shortcuts).map(
											([shortcuts, command], index) => {
												return (
													<Fragment key={command}>
														{index > 0 && <Divider />}
														<HStack w="100%">
															<Text>
																{SHORTCUT_NAMES[command]}
															</Text>
															<Box
																marginInlineStart={'auto'}
															>
																<KeyboardShortcut
																	shortcut={shortcuts}
																/>
															</Box>
														</HStack>
													</Fragment>
												);
											},
										)}
									</FeaturesPanel>
								</Features>
							</TabPanel>

							<TabPanel padding={0}>
								<Features>
									<FeaturesGroup>
										<FeaturesOption title="Version">
											<HStack gap="1rem" align="center">
												<Text>{getAbout().version}</Text>
												<Button size="sm" type="submit">
													Check for updates
												</Button>
											</HStack>
										</FeaturesOption>

										<FeaturesOption>
											<Switch size="sm" defaultChecked>
												Automatic check for updates
											</Switch>
										</FeaturesOption>

										<Divider />

										<FeaturesOption
											title="Language"
											description="Change the display language."
										>
											<Select size="sm" width="auto">
												<option>English</option>
												<option>Japanese</option>
												<option>Portuguese</option>
											</Select>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Vault lock">
										<FeaturesOption>
											<Switch size="sm">
												Lock vault when screen saver starts
											</Switch>
										</FeaturesOption>
										<FeaturesOption
											title="Lock Vault after idle"
											description="Vault will be locked after selected idle time."
										>
											<Select
												defaultValue="fs"
												size="sm"
												width={'auto'}
											>
												<option>Do not lock</option>
												<option>for 5 minutes</option>
												<option>for 10 minutes</option>
												<option>for 15 minutes</option>
												<option>for 30 minutes</option>
												<option>for 1 hour</option>
											</Select>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Notifications">
										<FeaturesOption>
											<Switch size="sm" defaultChecked>
												Use system notifications for reminders
											</Switch>
										</FeaturesOption>
									</FeaturesGroup>
								</Features>
							</TabPanel>

							<TabPanel padding={0}>
								<Features>
									<FeaturesGroup title="Appearance">
										<FeaturesOption title="Theme">
											<Select
												value={theme.name}
												size="sm"
												width="auto"
												onChange={(e) => {
													dispatch(
														settingsApi.setTheme({
															name: e.target.value as any,
														}),
													);
												}}
											>
												<option
													value="auto"
													title="Follow the system styles"
												>
													Auto
												</option>
												<option value="dark">Dark</option>
												<option value="light">Light</option>
												<option value="zen">Zen</option>
											</Select>
										</FeaturesOption>

										<FeaturesOption
											title="Accent color"
											description={
												theme.name === 'zen'
													? 'Accent color is not applicable to selected theme.'
													: undefined
											}
										>
											<ColorPicker
												isDisabled={theme.name === 'zen'}
												color={theme.accentColor}
												onChange={(color) => {
													dispatch(
														settingsApi.setTheme({
															accentColor: color,
														}),
													);
												}}
											/>
										</FeaturesOption>

										<Divider />

										<FeaturesOption
											title="Zoom level"
											description={`Adjust the default zoom level for all windows.\nIn case your system does not scale an apps automatically, you may change a zoom to make it fit an actual display pixel ratio (DPR). Detected DPR is ${getDevicePixelRatio()}.`}
										>
											<AppZoomLevel />
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Editor">
										<FeaturesOption title="Editor mode">
											<Select
												value={editorMode}
												size="sm"
												width="auto"
												onChange={(e) => {
													dispatch(
														settingsApi.setEditorMode(
															e.target.value as EditorMode,
														),
													);
												}}
											>
												{Object.entries(editorModes).map(
													([id, title]) => (
														<option key={id} value={id}>
															{title}
														</option>
													),
												)}
											</Select>
										</FeaturesOption>

										<FeaturesOption title="Font family">
											<Input
												size="sm"
												defaultValue={editorConfig.fontFamily}
											/>
										</FeaturesOption>

										<FeaturesOption title="Font size">
											<Input
												size="sm"
												defaultValue={editorConfig.fontSize}
											/>
										</FeaturesOption>

										<FeaturesOption title="Line height">
											<Input
												size="sm"
												defaultValue={editorConfig.lineHeight}
											/>
										</FeaturesOption>

										<FeaturesOption title="Plain text features">
											<VStack align={'start'} paddingTop={'.5rem'}>
												<Switch
													size="sm"
													defaultChecked={
														editorConfig.lineNumbers
													}
												>
													Show line numbers
												</Switch>
												<Switch
													size="sm"
													defaultChecked={editorConfig.miniMap}
												>
													Enable mini map
												</Switch>
											</VStack>
										</FeaturesOption>
									</FeaturesGroup>
								</Features>
							</TabPanel>

							<TabPanel padding={0}>
								<Features>
									<FeaturesGroup title="Vault settings">
										<FeaturesOption title="Vault name">
											<Input
												defaultValue="Personal notes"
												size="sm"
											/>
										</FeaturesOption>

										<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password.">
											<Switch size="sm">
												Remember workspaces passwords
											</Switch>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Files and data">
										<FeaturesOption title="Images compression">
											<Select size="sm" width="auto">
												<option>Compress images</option>
												<option>Do not compress images</option>
												<option selected>Always ask</option>
											</Select>
										</FeaturesOption>

										<FeaturesOption description="Delete files that is not used anymore.">
											<Switch size="sm">
												Delete orphaned files
											</Switch>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Encryption">
										<FeaturesOption title="Encryption algorithm">
											<Select defaultValue="aes" size="sm">
												{[
													{
														value: 'none',
														text: 'None',
													},
													{
														value: 'aes',
														text: 'AES',
													},
													{
														value: 'twofish',
														text: 'Twofish',
													},
												].map(({ value, text }) => (
													<option key={value} value={value}>
														{text}
													</option>
												))}
											</Select>
										</FeaturesOption>

										<FeaturesOption title="Password">
											<Button size="sm">Update password</Button>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Synchronization">
										<FeaturesOption description="Sync all data in database between your devices, to not loose it. All data are encrypted.">
											<Switch size="sm">
												Enable synchronization
											</Switch>
										</FeaturesOption>
										<FeaturesOption title="Synchronization method">
											<Select defaultValue="fs" size="sm">
												{[
													{
														value: 'fs',
														text: 'File system',
													},
													{
														value: 'server',
														text: 'Server',
													},
												].map(({ value, text }) => (
													<option key={value} value={value}>
														{text}
													</option>
												))}
											</Select>
										</FeaturesOption>
										<FeaturesOption title="Synchronization directory">
											<Input
												size="sm"
												placeholder="Enter path on directory"
												defaultValue="/foo/bar"
												disabled
											/>
										</FeaturesOption>
									</FeaturesGroup>
								</Features>
							</TabPanel>
							<TabPanel padding={0}>
								<Features>
									<FeaturesGroup title="Note creation">
										<FeaturesOption title="New note title">
											<Input
												size="sm"
												defaultValue={'Note $date$ $time$'}
											/>
										</FeaturesOption>
										<FeaturesOption title="Tags for new note">
											<Select size="sm" width="auto">
												<option>Do not set any tags</option>
												<option>Same as selected tag</option>
												<option>Assign tags below</option>
											</Select>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Snapshots">
										<FeaturesOption description="When enabled, a snapshots of note content will be created when note is changed. You may control snapshots recording per note level in note history panel.">
											<Switch size="sm" defaultChecked>
												Record note snapshots
											</Switch>
										</FeaturesOption>

										<FeaturesOption
											title="Delay for snapshot"
											description="Time in seconds to wait since recent note changes, before create a new snapshot. The lower time the more snapshots will be created, the large a vault size."
										>
											<InputGroup size="sm" width="auto">
												<Input
													width="8rem"
													textAlign="right"
													type="number"
													min={1}
													max={1000}
													defaultValue={30}
													sx={{
														paddingInlineEnd: '3rem',
													}}
												/>
												<InputRightElement
													w="3rem"
													pointerEvents={'none'}
												>
													<Text variant="secondary">sec</Text>
												</InputRightElement>
											</InputGroup>
										</FeaturesOption>
									</FeaturesGroup>

									<FeaturesGroup title="Trash bin">
										<FeaturesOption description="Ask before deleting a note.">
											<Switch size="sm" defaultChecked>
												Confirm deletion
											</Switch>
										</FeaturesOption>

										<FeaturesOption description="Move notes to a trash bin instead of permanent deletion so you can restore it later.">
											<Switch size="sm" defaultChecked>
												Move notes to bin
											</Switch>
										</FeaturesOption>

										<Divider />

										<FeaturesOption description="Note moved to bin will be permanently deleted after some time.">
											<Switch size="sm">
												Permanently delete old notes in bin
											</Switch>
										</FeaturesOption>

										<FeaturesOption
											title="Permanent deletion delay"
											description="Time interval in days to delete note from bin. Time counts from a moment you move note to bin."
										>
											<InputGroup size="sm" width="auto">
												<Input
													width="8rem"
													textAlign="right"
													type="number"
													min={1}
													max={1000}
													defaultValue={30}
													sx={{
														paddingInlineEnd: '3rem',
													}}
												/>
												<InputRightElement
													w="3rem"
													pointerEvents={'none'}
												>
													<Text variant="secondary">days</Text>
												</InputRightElement>
											</InputGroup>
										</FeaturesOption>
									</FeaturesGroup>
								</Features>
							</TabPanel>

							<TabPanel padding={0}>
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
													{...workspaceNameForm.register(
														'name',
													)}
													placeholder="e.g., Personal"
													flex="100"
													size="sm"
												/>
												<Button
													variant="accent"
													type="submit"
													size="sm"
												>
													Update
												</Button>
											</HStack>
											{workspaceNameForm.formState.errors.name && (
												<Text color="message.error">
													{
														workspaceNameForm.formState.errors
															.name.message
													}
												</Text>
											)}
										</FeaturesOption>

										<Divider />

										<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
											<Switch size="sm">
												Enable history for notes
											</Switch>
										</FeaturesOption>

										<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
											<Switch size="sm">Use recycle bin</Switch>
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
													It is not possible to delete last
													workspace in profile.{' '}
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
							</TabPanel>
							<TabPanel padding={0}>
								<VStack width={'100%'} align={'start'}>
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
												width={'100%'}
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
								</VStack>
							</TabPanel>
						</TabPanels>
					</Tabs>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
