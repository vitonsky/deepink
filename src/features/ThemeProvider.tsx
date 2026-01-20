import React, {
	PropsWithChildren,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import baseTheme from '@components/theme/base';
import darkTheme from '@components/theme/color-schemes/generic/dark';
import lightTheme from '@components/theme/color-schemes/generic/light';
import zenTheme from '@components/theme/color-schemes/zen';
import { useAppSelector } from '@state/redux/hooks';
import { selectTheme } from '@state/redux/settings/settings';

import { updateMonacoTheme } from './MonakoEditor/MonacoEditor';

export const accentColorsMap: Record<string, string> = {
	red: '#e0383e',
	pink: '#f74f9e',
	purple: '#953d96',
	orange: '#f7821b',
	yellow: '#ffc726',
	blue: '#0088ff',
};

const getSystemColorScheme = () => {
	const query = window.matchMedia('(prefers-color-scheme: dark)');

	return {
		current: query.matches ? 'dark' : 'light',
		subscribe(callback: (mode: 'dark' | 'light') => void) {
			const onChange = (event: MediaQueryListEvent) => {
				callback(event.matches ? 'dark' : 'light');
			};

			query.addEventListener('change', onChange);
			return () => {
				query.removeEventListener('change', onChange);
			};
		},
	} as const;
};

const useSystemColorSchemeCallback = (callback: (mode: 'dark' | 'light') => void) => {
	useEffect(() => {
		return getSystemColorScheme().subscribe(callback);
	}, [callback]);
};

const useSystemColorScheme = () => {
	const [systemTheme, setSystemTheme] = useState(getSystemColorScheme().current);
	useSystemColorSchemeCallback(setSystemTheme);

	return systemTheme;
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
	const { name, accentColor } = useAppSelector(selectTheme);
	const systemTheme = useSystemColorScheme();

	const theme = useMemo(() => {
		switch (name) {
			case 'zen': {
				return extendTheme(baseTheme, zenTheme);
			}
		}

		const colorMode = name === 'auto' ? systemTheme : name;
		const accentColorCode =
			accentColor && accentColor in accentColorsMap
				? accentColorsMap[accentColor]
				: accentColorsMap.blue;

		return extendTheme(
			baseTheme,
			colorMode === 'dark'
				? darkTheme(accentColorCode)
				: lightTheme(accentColorCode),
		);
	}, [accentColor, name, systemTheme]);

	useLayoutEffect(() => {
		updateMonacoTheme();

		// Forward update function to debug a theme
		(globalThis as any)[Symbol.for('updateMonacoTheme')] = updateMonacoTheme;
	}, [theme]);

	return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
};
