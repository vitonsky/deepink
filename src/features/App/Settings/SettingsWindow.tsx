import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	Box,
	Button,
	Checkbox,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Select,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { accentColorsMap } from '@features/ThemeProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useAppSelector } from '@state/redux/hooks';
import { selectTheme, settingsApi } from '@state/redux/settings/settings';

export const SettingsWindow = () => {
	const theme = useAppSelector(selectTheme);
	const dispatch = useDispatch();

	const [isOpen, setIsOpen] = useState(false);

	useCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
		setIsOpen(true);
	});

	return (
		<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="4xl">
			<ModalOverlay />
			<ModalContent w="800">
				<ModalHeader>Preferences</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack w="100%" minH="100%" p="2rem" justifyContent="center">
						<Features>
							<FeaturesHeader view="primary">
								Database settings
							</FeaturesHeader>

							<FeaturesOption title="Theme">
								<Select
									value={theme.name}
									onChange={(e) => {
										dispatch(
											settingsApi.setTheme({
												name: e.target.value as any,
											}),
										);
									}}
								>
									<option value="auto" title="Follow the system styles">
										Auto
									</option>
									<option value="dark">Dark</option>
									<option value="light">Light</option>
									<option value="zen">Zen</option>
								</Select>
							</FeaturesOption>

							<FeaturesOption title="Accent color">
								<HStack>
									{Object.entries(accentColorsMap).map(
										([name, code]) => {
											const isActive = name === theme.accentColor;
											return (
												<Box
													key={name}
													boxSize="1.3rem"
													backgroundColor={code}
													borderRadius="100%"
													outlineOffset={1}
													outline={
														isActive ? '3px solid' : undefined
													}
													outlineColor={
														isActive
															? 'control.action.active.background'
															: 'transparent'
													}
													onClick={() => {
														dispatch(
															settingsApi.setTheme({
																accentColor: name,
															}),
														);
													}}
												></Box>
											);
										},
									)}
								</HStack>
							</FeaturesOption>

							<FeaturesOption title="Database name">
								<Input
									placeholder="Enter database name"
									defaultValue="My database"
								/>
							</FeaturesOption>

							<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password">
								<Checkbox>Remember workspaces passwords</Checkbox>
							</FeaturesOption>

							<FeaturesHeader view="section">Encryption</FeaturesHeader>

							<FeaturesOption
								title="Encryption algorithm"
								description="Choose best algorithm you trust"
							>
								<Select defaultValue="aes">
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
								<Button>Update password</Button>
							</FeaturesOption>

							<FeaturesHeader view="section">
								Synchronization
							</FeaturesHeader>

							<FeaturesOption description="Sync all data in database between your devices, to not loose it. All data are encrypted.">
								<Checkbox>Enable synchronization</Checkbox>
							</FeaturesOption>
							<FeaturesOption title="Synchronization method">
								<Select defaultValue="fs">
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
									placeholder="Enter path on directory"
									defaultValue="/foo/bar"
									disabled
								/>
							</FeaturesOption>
						</Features>
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
