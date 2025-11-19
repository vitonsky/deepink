import React, { useState } from 'react';
import {
	Button,
	Checkbox,
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
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';

export const SettingsWindow = () => {
	const [isOpen, setIsOpen] = useState(false);

	useCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
		setIsOpen(true);
	});

	return (
		<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="4xl">
			<ModalOverlay />
			<ModalContent w="800">
				<ModalHeader>Modal Title</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack w="100%" minH="100%" p="2rem" justifyContent="center">
						<Features>
							<FeaturesHeader view="primary">
								Database settings
							</FeaturesHeader>

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
								<Select variant="secondary" defaultValue="aes">
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
								<Select variant="secondary" defaultValue="fs">
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
