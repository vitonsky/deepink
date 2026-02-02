import React, { useState } from 'react';
import {
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
} from '@chakra-ui/react';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';

import { AppearanceSettings } from './AppearanceSettings';
import { GeneralSettings } from './sections/GeneralSettings';
import { HotKeysSettings } from './sections/HotKeysSettings';
import { ImportAndExport } from './sections/ImportAndExport';
import { NoteSettings } from './sections/NoteSettings';
import { VaultSettings } from './sections/VaultSettings';
import { WorkspaceSettings } from './sections/WorkspaceSettings';

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
			<ModalContent maxWidth="800px">
				<ModalHeader paddingInline="1rem">Preferences</ModalHeader>
				<ModalCloseButton />
				<ModalBody paddingInline="1rem" paddingBlockEnd="2rem">
					<Tabs orientation="vertical" gap="1rem">
						<TabList
							display="flex"
							flexWrap="wrap"
							width="200px"
							gap="1px"
							flexShrink={0}
						>
							{tabs.map((tab) => {
								return (
									<Tab
										key={tab.id}
										justifyContent="start"
										borderRadius="4px"
										padding=".3rem .5rem"
									>
										{tab.content}
									</Tab>
								);
							})}

							<Text fontWeight="bold" marginTop="2rem">
								Workspace
							</Text>
							{workspaceTabs.map((tab) => {
								return (
									<Tab
										key={tab.id}
										justifyContent="start"
										borderRadius="4px"
										padding=".3rem .5rem"
									>
										{tab.content}
									</Tab>
								);
							})}
						</TabList>

						<TabPanels maxWidth="600px" minWidth="400px" width="100%">
							<TabPanel padding={0}>
								<HotKeysSettings />
							</TabPanel>

							<TabPanel padding={0}>
								<GeneralSettings />
							</TabPanel>

							<TabPanel padding={0}>
								<AppearanceSettings />
							</TabPanel>

							<TabPanel padding={0}>
								<VaultSettings />
							</TabPanel>
							<TabPanel padding={0}>
								<NoteSettings />
							</TabPanel>

							<TabPanel padding={0}>
								<WorkspaceSettings />
							</TabPanel>
							<TabPanel padding={0}>
								<ImportAndExport />
							</TabPanel>
						</TabPanels>
					</Tabs>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
