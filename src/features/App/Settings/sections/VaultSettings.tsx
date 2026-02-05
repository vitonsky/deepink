import React from 'react';
import z from 'zod';
import {
	Button,
	Divider,
	Input,
	InputGroup,
	InputRightElement,
	Select,
	Switch,
	Text,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { useAppDispatch } from '@state/redux/hooks';
import { useVaultActions, useVaultSelector } from '@state/redux/profiles/hooks';
import { selectSnapshotSettings } from '@state/redux/profiles/selectors/vault';

export const VaultSettings = () => {
	const dispatch = useAppDispatch();
	const snapshotsConfig = useVaultSelector(selectSnapshotSettings);
	const vaultActions = useVaultActions();

	return (
		<Features>
			<FeaturesGroup>
				<FeaturesOption title="Vault name">
					<Input defaultValue="Personal notes" size="sm" />
				</FeaturesOption>

				<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password.">
					<Switch size="sm">Remember workspaces passwords</Switch>
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
					<Switch size="sm">Delete orphaned files</Switch>
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

			<FeaturesGroup title="Snapshots">
				<FeaturesOption description="When enabled, a snapshots of note content will be created when note is changed. You may control snapshots recording per note level in note history panel.">
					<Switch
						size="sm"
						isChecked={snapshotsConfig.enabled}
						onChange={(evt) => {
							dispatch(
								vaultActions.setSnapshotsConfig({
									enabled: evt.target.checked,
								}),
							);
						}}
					>
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
							value={Math.round(snapshotsConfig.interval / 1000)}
							onChange={(evt) => {
								const result = z.coerce
									.number()
									.min(1)
									.safeParse(evt.target.value);

								const value = result.success
									? result.data * 1000
									: 30_000;
								dispatch(
									vaultActions.setSnapshotsConfig({
										interval: value,
									}),
								);
							}}
							sx={{
								paddingInlineEnd: '3rem',
							}}
						/>
						<InputRightElement w="3rem" pointerEvents="none">
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
					<Switch size="sm">Permanently delete old notes in bin</Switch>
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
						<InputRightElement w="3rem" pointerEvents="none">
							<Text variant="secondary">days</Text>
						</InputRightElement>
					</InputGroup>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
