import React from 'react';
import { getAbout } from 'src/about';
import Logo from '@assets/icons/app.svg';
import {
	Box,
	Button,
	Divider,
	HStack,
	Select,
	Switch,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup, FeaturesPanel } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';

export const GeneralSettings = () => {
	return (
		<Features>
			<FeaturesPanel align="center" paddingBlock="2rem">
				<Box as={Logo} boxSize="100px" />

				<VStack gap=".3rem">
					<Text fontSize="1.5rem" lineHeight="1">
						General settings
					</Text>
					<Text variant="secondary">
						Manage your overall preferences in app.
					</Text>
				</VStack>

				<Divider />

				<FeaturesOption title="Version">
					<HStack gap="1rem" align="center">
						<Text>{getAbout().version}</Text>
						<Button size="sm" type="submit">
							Check for updates
						</Button>
					</HStack>
				</FeaturesOption>

				<FeaturesOption description="App will periodically check for updates and notify if new version is available">
					<Switch size="sm" defaultChecked>
						Automatic check for updates
					</Switch>
				</FeaturesOption>
			</FeaturesPanel>

			<FeaturesGroup>
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

				<FeaturesOption
					title="Notifications"
					description="System notifications will be used only for reminders. When disabled, a reminders will appear only in app notifications list."
				>
					<Switch size="sm" defaultChecked>
						Use system notifications for reminders
					</Switch>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Vault lock">
				<FeaturesOption>
					<Switch size="sm">Lock vault when screen saver starts</Switch>
				</FeaturesOption>
				<FeaturesOption
					title="Lock Vault after idle"
					description="Vault will be locked after selected idle time."
				>
					<Select defaultValue="fs" size="sm" width="auto">
						<option>Do not lock</option>
						<option>for 5 minutes</option>
						<option>for 10 minutes</option>
						<option>for 15 minutes</option>
						<option>for 30 minutes</option>
						<option>for 1 hour</option>
					</Select>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
