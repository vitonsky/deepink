import React from 'react';
import ms from 'ms';
import { getAbout } from 'src/about';
import z from 'zod';
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
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectIsCheckForUpdatesEnabled,
	selectVaultLockConfig,
} from '@state/redux/settings/selectors/preferences';
import { settingsApi } from '@state/redux/settings/settings';

export const GeneralSettings = () => {
	const dispatch = useAppDispatch();

	const vaultLockConfig = useAppSelector(selectVaultLockConfig);
	const isCheckForUpdatesEnabled = useAppSelector(selectIsCheckForUpdatesEnabled);

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
					<Switch
						size="sm"
						isChecked={isCheckForUpdatesEnabled}
						onChange={(evt) => {
							dispatch(settingsApi.setCheckForUpdates(evt.target.checked));
						}}
					>
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
				<FeaturesOption description="Vault will be locked when a screen saver will start, or a device will sleep">
					<Switch
						size="sm"
						isChecked={vaultLockConfig.lockOnSystemLock}
						onChange={(evt) => {
							dispatch(
								settingsApi.setVaultLockConfig({
									lockOnSystemLock: evt.target.checked,
								}),
							);
						}}
					>
						Lock vault when system locks
					</Switch>
				</FeaturesOption>
				<FeaturesOption
					title="Lock Vault after idle"
					description="Vault will be locked after selected idle time."
				>
					<Select
						size="sm"
						width="auto"
						value={vaultLockConfig.lockAfterIdle ?? 'never'}
						onChange={(evt) => {
							const result = z.coerce
								.number()
								.or(z.literal('never'))
								.transform((value) => (value === 'never' ? null : value))
								.safeParse(evt.target.value);

							dispatch(
								settingsApi.setVaultLockConfig({
									lockAfterIdle: result.success ? result.data : null,
								}),
							);
						}}
					>
						<option value="never">Do not lock</option>
						<option value={ms('5m')}>for 5 minutes</option>
						<option value={ms('10m')}>for 10 minutes</option>
						<option value={ms('15m')}>for 15 minutes</option>
						<option value={ms('30m')}>for 30 minutes</option>
						<option value={ms('1h')}>for 1 hour</option>
						<option value={ms('2h')}>for 2 hours</option>
						<option value={ms('3h')}>for 3 hours</option>
						<option value={ms('5h')}>for 5 hours</option>
					</Select>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
