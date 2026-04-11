import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Divider, Link, Select, Switch, Text, VStack } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { RelaxedInput } from '@components/RelaxedInput';
import { RelaxedSlider } from '@components/Slider/RelaxedSlider';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectEditorConfig,
	selectEditorFontFamily,
} from '@state/redux/settings/selectors/preferences';
import {
	defaultSettings,
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { FontFamilyInput } from './FontFamilyInput';

export const EditorConfig = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);
	const editorConfig = useAppSelector(selectEditorConfig);
	const editorFontFamily = useAppSelector(selectEditorFontFamily);

	return (
		<>
			<FeaturesGroup title={t('editor.groupTitle')}>
				<FeaturesOption title={t('editor.mode.title')}>
					<Select
						value={editorMode}
						size="sm"
						width="auto"
						onChange={(e) => {
							dispatch(
								settingsApi.setEditorMode(e.target.value as EditorMode),
							);
						}}
					>
						{Object.entries(editorModes).map(([id, title]) => (
							<option key={id} value={id}>
								{title}
							</option>
						))}
					</Select>
				</FeaturesOption>

				<FeaturesOption
					title={t('editor.fontFamily.title')}
					description={t('editor.fontFamily.description')}
				>
					<FontFamilyInput
						inputProps={{
							size: 'sm',
							placeholder: t('editor.fontFamily.placeholder'),
							fontFamily: editorFontFamily,
						}}
						fontSize={editorConfig.fontSize}
						value={editorConfig.fontFamily}
						onChange={(fontFamily) => {
							dispatch(settingsApi.setEditorConfig({ fontFamily }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title={t('editor.fontSize.title')}>
					<RelaxedSlider
						min={10}
						max={30}
						resetValue={defaultSettings.editor.fontSize}
						value={editorConfig.fontSize}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ fontSize: value }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title={t('editor.lineHeight.title')}>
					<RelaxedSlider
						min={1.2}
						max={2}
						step={0.1}
						resetValue={defaultSettings.editor.lineHeight}
						value={editorConfig.lineHeight}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ lineHeight: value }));
						}}
					/>
				</FeaturesOption>

				<Divider />

				<FeaturesOption
					title={t('editor.dateFormat.title')}
					description={
						<Trans
							i18nKey="editor.dateFormat.description"
							ns={LOCALE_NAMESPACE.settings}
							components={{
								formatLink: (
									<Link href="https://day.js.org/docs/en/display/format">
										{t('editor.dateFormat.formatReference')}
									</Link>
								),
							}}
						/>
					}
				>
					<RelaxedInput
						size="sm"
						placeholder="e.g., DD/MM/YYYY HH:mm"
						value={editorConfig.dateFormat}
						onValueChange={(value) => {
							dispatch(
								settingsApi.setEditorConfig({
									dateFormat: value,
								}),
							);
						}}
					/>

					{editorConfig.dateFormat.trim().length > 0 && (
						<VStack align="start" gap={0} maxWidth="100%">
							<Text fontSize=".8rem">{t('editor.dateFormat.example')}</Text>
							<Text fontWeight="bold" maxWidth="100%">
								{dayjs().format(editorConfig.dateFormat)}
							</Text>
						</VStack>
					)}
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title={t('editor.plainText.groupTitle')}>
				<FeaturesOption>
					<Switch
						size="sm"
						isChecked={editorConfig.lineNumbers}
						onChange={(evt) => {
							dispatch(
								settingsApi.setEditorConfig({
									lineNumbers: evt.target.checked,
								}),
							);
						}}
					>
						{t('editor.plainText.lineNumbers')}
					</Switch>
				</FeaturesOption>

				<FeaturesOption>
					<Switch
						size="sm"
						isChecked={editorConfig.miniMap}
						onChange={(evt) => {
							dispatch(
								settingsApi.setEditorConfig({
									miniMap: evt.target.checked,
								}),
							);
						}}
					>
						{t('editor.plainText.miniMap')}
					</Switch>
				</FeaturesOption>
			</FeaturesGroup>
		</>
	);
};
