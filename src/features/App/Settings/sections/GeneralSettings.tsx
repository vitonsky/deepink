import React from 'react';
import { getAbout } from 'src/about';
import { Button, Divider, HStack, Select, Switch, Text } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';

export const GeneralSettings = () => {
	return (
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

			<FeaturesGroup title="Notifications">
				<FeaturesOption>
					<Switch size="sm" defaultChecked>
						Use system notifications for reminders
					</Switch>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
