import React, { Fragment, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getAbout } from 'src/about';
import {
	Box,
	Button,
	Divider,
	HStack,
	Input,
	InputGroup,
	InputRightElement,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Select,
	Switch,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup, FeaturesPanel } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { GLOBAL_COMMANDS, SHORTCUT_NAMES } from '@hooks/commands';
import { shortcuts } from '@hooks/commands/shortcuts';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorConfig } from '@state/redux/settings/selectors/preferences';
import {
	EditorMode,
	selectEditorMode,
	selectTheme,
	settingsApi,
} from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

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

// TODO: add help section with links
// TODO: add section with workspace settings
// TODO: move panels to separate components
// TODO: connect controls to a data and make changes
// TODO: use range selectors instead of numbers for options with limited range of values
// TODO: suggest available fonts
// TODO: add sync targets list
export const SettingsWindow = () => {
	const dispatch = useDispatch();
	const editorMode = useAppSelector(selectEditorMode);

	const theme = useAppSelector(selectTheme);
	const editorConfig = useAppSelector(selectEditorConfig);

	const [isOpen, setIsOpen] = useState(true);

	useCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
		setIsOpen(true);
	});

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
						<TabList display="flex" flexWrap="wrap" width={'200px'} gap="1px">
							{tabs.map((tab) => {
								return (
									<Tab
										key={tab.id}
										justifyContent={'start'}
										borderRadius={'4px'}
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
															<Text
																marginInlineStart={'auto'}
															>
																<KeyboardShortcut
																	shortcut={shortcuts}
																/>
															</Text>
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
						</TabPanels>
					</Tabs>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
