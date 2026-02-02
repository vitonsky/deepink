import React from 'react';
import { Divider, Select } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectTheme, settingsApi } from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

export const Appearance = () => {
	const dispatch = useAppDispatch();
	const theme = useAppSelector(selectTheme);

	return (
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
	);
};
