import React from 'react';
import { Divider, Input, Select, Switch, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectEditorConfig } from '@state/redux/settings/selectors/preferences';
import {
	EditorMode,
	selectEditorMode,
	selectTheme,
	settingsApi,
} from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

export const AppearanceSettings = () => {
	const editorMode = useAppSelector(selectEditorMode);

	const theme = useAppSelector(selectTheme);
	const editorConfig = useAppSelector(selectEditorConfig);

	const dispatch = useAppDispatch();

	return (
		<Features>
			<FeaturesGroup title="Appearance">
				<FeaturesOption title="Theme">
					<Select
						value={theme.name}
						size="sm"
						width="auto"
						onChange={(e) => {
							dispatch(
								settingsApi.setTheme({
									name: e.target.value as any,
								}),
							);
						}}
					>
						<option value="auto" title="Follow the system styles">
							Auto
						</option>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
						<option value="zen">Zen</option>
					</Select>
				</FeaturesOption>

				<FeaturesOption
					title="Accent color"
					description={
						theme.name === 'zen'
							? 'Accent color is not applicable to selected theme.'
							: undefined
					}
				>
					<ColorPicker
						isDisabled={theme.name === 'zen'}
						color={theme.accentColor}
						onChange={(color) => {
							dispatch(
								settingsApi.setTheme({
									accentColor: color,
								}),
							);
						}}
					/>
				</FeaturesOption>

				<Divider />

				<FeaturesOption
					title="Zoom level"
					description={`Adjust the default zoom level for all windows.\nIn case your system does not scale an apps automatically, you may change a zoom to make it fit an actual display pixel ratio (DPR). Detected DPR is ${getDevicePixelRatio()}.`}
				>
					<AppZoomLevel />
				</FeaturesOption>
			</FeaturesGroup>

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

				<FeaturesOption title="Font family">
					<Input size="sm" defaultValue={editorConfig.fontFamily} />
				</FeaturesOption>

				<FeaturesOption title="Font size">
					<Input size="sm" defaultValue={editorConfig.fontSize} />
				</FeaturesOption>

				<FeaturesOption title="Line height">
					<Input size="sm" defaultValue={editorConfig.lineHeight} />
				</FeaturesOption>

				<FeaturesOption title="Plain text features">
					<VStack align="start" paddingTop=".5rem">
						<Switch size="sm" defaultChecked={editorConfig.lineNumbers}>
							Show line numbers
						</Switch>
						<Switch size="sm" defaultChecked={editorConfig.miniMap}>
							Enable mini map
						</Switch>
					</VStack>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
