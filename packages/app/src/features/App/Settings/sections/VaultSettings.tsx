import React from 'react';
import { useTranslation } from 'react-i18next';
import humanizeDuration from 'humanize-duration';
import ms from 'ms';
import { LOCALE_NAMESPACE } from 'src/i18n';
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
import { RelaxedInput } from '@components/RelaxedInput';
import { RelaxedSlider } from '@components/Slider/RelaxedSlider';
import { useAppDispatch } from '@state/redux/hooks';
import { useVaultActions, useVaultSelector } from '@state/redux/profiles/hooks';
import { defaultVaultConfig } from '@state/redux/profiles/profiles';
import {
	selectDeletionConfig,
	selectIntegrityServiceConfig,
	selectSnapshotSettings,
} from '@state/redux/profiles/selectors/vault';

export const VaultSettings = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();
	const vaultActions = useVaultActions();

	const snapshotsConfig = useVaultSelector(selectSnapshotSettings);
	const deletionConfig = useVaultSelector(selectDeletionConfig);
	const filesIntegrityConfig = useVaultSelector(selectIntegrityServiceConfig);

	return (
		<Features>
			<FeaturesGroup>
				<FeaturesOption title={t('vault.name.title')}>
					<Input defaultValue="Personal notes" size="sm" />
				</FeaturesOption>

				<FeaturesOption description={t('vault.rememberPasswords.description')}>
					<Switch size="sm">{t('vault.rememberPasswords.label')}</Switch>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('vault.filesAndData.groupTitle')}>
				<FeaturesOption title={t('vault.filesAndData.imagesCompression.title')}>
					<Select size="sm" width="auto">
						<option>
							{t('vault.filesAndData.imagesCompression.compress')}
						</option>
						<option>
							{t('vault.filesAndData.imagesCompression.doNotCompress')}
						</option>
						<option selected>
							{t('vault.filesAndData.imagesCompression.alwaysAsk')}
						</option>
					</Select>
				</FeaturesOption>

				<FeaturesOption
					description={t('vault.filesAndData.deleteOrphaned.description')}
				>
					<Switch
						size="sm"
						isChecked={filesIntegrityConfig.enabled}
						onChange={(evt) => {
							dispatch(
								vaultActions.setFilesIntegrityConfig({
									enabled: evt.target.checked,
								}),
							);
						}}
					>
						{t('vault.filesAndData.deleteOrphaned.label')}
					</Switch>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('vault.encryption.groupTitle')}>
				<FeaturesOption title={t('vault.encryption.algorithm.title')}>
					<Select defaultValue="aes" size="sm">
						{[
							{
								value: 'none',
								text: t('vault.encryption.algorithm.none'),
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

				<FeaturesOption title={t('vault.encryption.password.title')}>
					<Button size="sm">{t('vault.encryption.password.update')}</Button>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('vault.synchronization.groupTitle')}>
				<FeaturesOption
					description={t('vault.synchronization.enable.description')}
				>
					<Switch size="sm">{t('vault.synchronization.enable.label')}</Switch>
				</FeaturesOption>
				<FeaturesOption title={t('vault.synchronization.method.title')}>
					<Select defaultValue="fs" size="sm">
						{[
							{
								value: 'fs',
								text: t('vault.synchronization.method.fileSystem'),
							},
							{
								value: 'server',
								text: t('vault.synchronization.method.server'),
							},
						].map(({ value, text }) => (
							<option key={value} value={value}>
								{text}
							</option>
						))}
					</Select>
				</FeaturesOption>
				<FeaturesOption title={t('vault.synchronization.directory.title')}>
					<Input
						size="sm"
						placeholder={t('vault.synchronization.directory.placeholder')}
						defaultValue="/foo/bar"
						disabled
					/>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('vault.snapshots.groupTitle')}>
				<FeaturesOption description={t('vault.snapshots.record.description')}>
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
						{t('vault.snapshots.record.label')}
					</Switch>
				</FeaturesOption>

				<FeaturesOption
					title={t('vault.snapshots.delay.title')}
					description={t('vault.snapshots.delay.description')}
				>
					<RelaxedSlider
						min={ms('10s')}
						max={ms('5m')}
						step={ms('10s')}
						resetValue={defaultVaultConfig.snapshots.interval}
						transformValue={(value) =>
							humanizeDuration(value, { units: ['m', 's'] })
						}
						value={snapshotsConfig.interval}
						onChange={(value) => {
							dispatch(
								vaultActions.setSnapshotsConfig({
									interval: value,
								}),
							);
						}}
					/>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('vault.trashBin.groupTitle')}>
				<FeaturesOption
					description={t('vault.trashBin.confirmDeletion.description')}
				>
					<Switch
						size="sm"
						isChecked={deletionConfig.confirm}
						onChange={(evt) => {
							dispatch(
								vaultActions.setNoteDeletionConfig({
									confirm: evt.target.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.confirmDeletion.label')}
					</Switch>
				</FeaturesOption>

				<FeaturesOption description={t('vault.trashBin.moveToBin.description')}>
					<Switch
						size="sm"
						isChecked={!deletionConfig.permanentDeletion}
						onChange={(evt) => {
							dispatch(
								vaultActions.setNoteDeletionConfig({
									permanentDeletion: !evt.target.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.moveToBin.label')}
					</Switch>
				</FeaturesOption>

				<Divider />

				<FeaturesOption description={t('vault.trashBin.autoPurge.description')}>
					<Switch
						size="sm"
						isChecked={deletionConfig.bin.autoClean}
						onChange={(evt) => {
							dispatch(
								vaultActions.setBinAutoDeletionConfig({
									autoClean: evt.target.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.autoPurge.label')}
					</Switch>
				</FeaturesOption>

				<FeaturesOption
					title={t('vault.trashBin.purgeDelay.title')}
					description={t('vault.trashBin.purgeDelay.description')}
				>
					<InputGroup size="sm" width="auto">
						<RelaxedInput
							width="8rem"
							textAlign="right"
							type="number"
							min={1}
							max={1000}
							sx={{
								paddingInlineEnd: '3rem',
							}}
							value={deletionConfig.bin.cleanInterval}
							onValueChange={(value) => {
								const result = z.coerce.number().min(1).safeParse(value);
								const days = result.data ?? 30;

								dispatch(
									vaultActions.setBinAutoDeletionConfig({
										cleanInterval: days,
									}),
								);
							}}
						/>
						<InputRightElement w="3rem" pointerEvents="none">
							<Text variant="secondary">
								{t('vault.trashBin.purgeDelay.unit')}
							</Text>
						</InputRightElement>
					</InputGroup>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
