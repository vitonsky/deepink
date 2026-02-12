import React, { useState } from 'react';
import {
	FaFileImport,
	FaGear,
	FaInbox,
	FaKeyboard,
	FaPalette,
	FaVault,
} from 'react-icons/fa6';
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
import { TextWithIcon } from '@components/TextWithIcon';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';

import { AppearanceSettings } from './sections/appearance';
import { GeneralSettings } from './sections/GeneralSettings';
import { HotKeysSettings } from './sections/HotKeysSettings';
import { ImportAndExport } from './sections/ImportAndExport';
import { VaultSettings } from './sections/VaultSettings';
import { WorkspaceSettings } from './sections/WorkspaceSettings';

// TODO: add icons
type SettingsSection = {
	id: string;
	title: string;
	component: React.ComponentType;
	icon?: React.ComponentType;
};

const tabs: SettingsSection[] = [
	{
		id: 'general',
		title: 'General',
		component: GeneralSettings,
		icon: FaGear,
	},
	{
		id: 'appearance',
		title: 'Appearance',
		component: AppearanceSettings,
		icon: FaPalette,
	},
	{
		id: 'vault',
		title: 'Vault',
		component: VaultSettings,
		icon: FaVault,
	},
	{
		id: 'hotkeys',
		title: 'Hotkeys',
		component: HotKeysSettings,
		icon: FaKeyboard,
	},
];

const workspaceTabs: SettingsSection[] = [
	{
		id: 'workspace-settings',
		title: 'Workspace Settings',
		component: WorkspaceSettings,
		icon: FaInbox,
	},
	{
		id: 'import-and-export',
		title: 'Import & Export',
		component: ImportAndExport,
		icon: FaFileImport,
	},
];

// TODO: add help section with links
export const SettingsWindow = () => {
	const [isOpen, setIsOpen] = useState(false);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
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
			<ModalContent maxWidth="800px" minHeight="500px">
				<ModalHeader paddingInline="1rem">Preferences</ModalHeader>
				<ModalCloseButton />
				<ModalBody paddingInline="1rem" paddingBlockEnd="2rem">
					<Tabs
						orientation="vertical"
						gap="1rem"
						isLazy
						lazyBehavior="keepMounted"
					>
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
										<TextWithIcon icon={tab.icon && <tab.icon />}>
											{tab.title}
										</TextWithIcon>
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
										<TextWithIcon icon={tab.icon && <tab.icon />}>
											{tab.title}
										</TextWithIcon>
									</Tab>
								);
							})}
						</TabList>

						<TabPanels maxWidth="600px" minWidth="400px" width="100%">
							{tabs.map((tab) => {
								return (
									<TabPanel key={tab.id} padding={0}>
										{tab.id !== 'general' && (
											<Text
												fontSize="1.5rem"
												lineHeight="1"
												marginBottom="1rem"
											>
												{tab.title}
											</Text>
										)}
										<tab.component />
									</TabPanel>
								);
							})}

							{workspaceTabs.map((tab) => {
								return (
									<TabPanel key={tab.id} padding={0}>
										<Text
											fontSize="1.5rem"
											lineHeight="1"
											marginBottom="1rem"
										>
											{tab.title}
										</Text>
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
