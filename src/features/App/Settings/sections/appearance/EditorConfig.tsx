import React from 'react';
import dayjs from 'dayjs';
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
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { FontFamilyInput } from './FontFamilyInput';

export const EditorConfig = () => {
	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);
	const editorConfig = useAppSelector(selectEditorConfig);
	const editorFontFamily = useAppSelector(selectEditorFontFamily);

	return (
		<>
			<FeaturesGroup title="Editor">
				<FeaturesOption title="Editor mode">
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
					title="Font family"
					description="Set a font family to use in all editors, or leave empty to use defaults."
				>
					<FontFamilyInput
						inputProps={{
							size: 'sm',
							placeholder: 'Enter font family name',
							fontFamily: editorFontFamily,
						}}
						fontSize={editorConfig.fontSize}
						value={editorConfig.fontFamily}
						onChange={(fontFamily) => {
							dispatch(settingsApi.setEditorConfig({ fontFamily }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title="Font size">
					<RelaxedSlider
						min={8}
						max={32}
						value={editorConfig.fontSize}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ fontSize: value }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title="Line height">
					<RelaxedSlider
						min={0.3}
						max={5}
						step={0.1}
						value={editorConfig.lineHeight}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ lineHeight: value }));
						}}
					/>
				</FeaturesOption>

				<Divider />

				<FeaturesOption
					title="Date format"
					description={
						<>
							Configure a format of date to insert. You may use standard
							syntax DD/MM/YYYY HH:mm:ss.
							<br />
							For more syntax, refer to{' '}
							<Link href="https://day.js.org/docs/en/display/format">
								date format reference
							</Link>
							.
						</>
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
							<Text fontSize=".8rem">Example</Text>
							<Text fontWeight="bold" maxWidth="100%">
								{dayjs().format(editorConfig.dateFormat)}
							</Text>
						</VStack>
					)}
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Plain text editor">
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
						Show line numbers
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
						Enable mini map
					</Switch>
				</FeaturesOption>
			</FeaturesGroup>
		</>
	);
};
