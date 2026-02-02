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
type SettingsSection = {
	id: string;
	title: string;
	component: React.ComponentType;
};

const tabs: SettingsSection[] = [
	{
		id: 'general',
		title: 'General',
		component: GeneralSettings,
	},
	{
		id: 'appearance',
		title: 'Appearance',
		component: AppearanceSettings,
	},
	{
		id: 'vault',
		title: 'Vault',
		component: VaultSettings,
	},
	{
		id: 'notes',
		title: 'Notes',
		component: NoteSettings,
	},
	{
		id: 'hotkeys',
		title: 'Hotkeys',
		component: HotKeysSettings,
	},
];

const workspaceTabs: SettingsSection[] = [
	{
		id: 'workspace-settings',
		title: 'Workspace Settings',
		component: WorkspaceSettings,
	},
	{
		id: 'import-and-export',
		title: 'Import & Export',
		component: ImportAndExport,
	},
];

// TODO: add help section with links
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
										{tab.title}
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
										{tab.title}
									</Tab>
								);
							})}
						</TabList>

						<TabPanels maxWidth="600px" minWidth="400px" width="100%">
							{tabs.map((tab) => {
								return (
									<TabPanel key={tab.id} padding={0}>
										<tab.component />
									</TabPanel>
								);
							})}

							{workspaceTabs.map((tab) => {
								return (
									<TabPanel key={tab.id} padding={0}>
										<tab.component />
									</TabPanel>
								);
							})}
						</TabPanels>
					</Tabs>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};
