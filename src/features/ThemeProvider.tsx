import React, { PropsWithChildren, useMemo } from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import baseTheme from '@components/theme/base';
import darkTheme from '@components/theme/color-schemes/generic/dark';
import lightTheme from '@components/theme/color-schemes/generic/light';
import zenTheme from '@components/theme/color-schemes/zen';
import { useAppSelector } from '@state/redux/hooks';
import { selectTheme } from '@state/redux/settings/settings';

const colorsMap: Record<string, string> = {
	red: '#ff0707ff',
	pink: '#ff07bdff',
	purple: '#9807ffff',
	orange: '#ff6606ff',
	yellow: '#ffff07ff',
	blue: '#0655ffff',
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
	const { name, accentColor } = useAppSelector(selectTheme);
	const theme = useMemo(() => {
		switch (name) {
			case 'zen': {
				return extendTheme(baseTheme, zenTheme);
			}
		}

		const accentColorCode =
			accentColor && accentColor in colorsMap
				? colorsMap[accentColor]
				: colorsMap.blue;

		return extendTheme(
			baseTheme,
			name === 'dark' ? darkTheme(accentColorCode) : lightTheme(accentColorCode),
		);
	}, [accentColor, name]);

	return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
};
