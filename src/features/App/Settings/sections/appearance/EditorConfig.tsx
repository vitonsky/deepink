import React from 'react';
import { Input, Select, Switch, VStack } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectEditorConfig } from '@state/redux/settings/selectors/preferences';
import {
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { SimpleSlider } from './SimpleSlider';

export const EditorConfig = () => {
	const editorMode = useAppSelector(selectEditorMode);

	const editorConfig = useAppSelector(selectEditorConfig);

	const dispatch = useAppDispatch();

	return (
		<FeaturesGroup title="Editor">
			<FeaturesOption title="Editor mode">
				<Select
					value={editorMode}
					size="sm"
					width="auto"
					onChange={(e) => {
						dispatch(settingsApi.setEditorMode(e.target.value as EditorMode));
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
				<SimpleSlider
					min={8}
					max={32}
					value={editorConfig.fontSize}
					onChange={(value) => {
						dispatch(settingsApi.setEditorConfig({ fontSize: value }));
					}}
				/>
			</FeaturesOption>

			<FeaturesOption title="Line height">
				<SimpleSlider
					min={0.3}
					max={5}
					step={0.1}
					value={editorConfig.lineHeight}
					onChange={(value) => {
						dispatch(settingsApi.setEditorConfig({ lineHeight: value }));
					}}
				/>
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
	);
};
