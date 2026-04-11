import React from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Divider, Select } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectTheme, settingsApi } from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

export const Appearance = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();
	const theme = useAppSelector(selectTheme);

	return (
		<FeaturesGroup>
			<FeaturesOption title={t('appearance.theme.title')}>
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
					<option value="auto">{t('appearance.theme.auto')}</option>
					<option value="dark">{t('appearance.theme.dark')}</option>
					<option value="light">{t('appearance.theme.light')}</option>
					<option value="zen">{t('appearance.theme.zen')}</option>
				</Select>
			</FeaturesOption>

			<FeaturesOption
				title={t('appearance.accentColor.title')}
				description={
					theme.name === 'zen'
						? t('appearance.accentColor.zenNotApplicable')
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
				title={t('appearance.zoomLevel.title')}
				description={t('appearance.zoomLevel.description', {
					dpr: getDevicePixelRatio(),
				})}
			>
				<AppZoomLevel />
			</FeaturesOption>
		</FeaturesGroup>
	);
};
