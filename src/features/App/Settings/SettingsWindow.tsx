import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	Button,
	Divider,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Select,
	Switch,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useAppSelector } from '@state/redux/hooks';
import { selectTheme, settingsApi } from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

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
						<Features maxWidth="600px">
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

								<FeaturesOption title="Accent color">
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

							<FeaturesGroup title="Database settings">
								<FeaturesOption title="Database name">
									<Input
										placeholder="Enter database name"
										defaultValue="My database"
										size="sm"
									/>
								</FeaturesOption>

								<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password.">
									<Switch size="sm">
										Remember workspaces passwords
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
									<Switch size="sm">Enable synchronization</Switch>
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
					</VStack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
