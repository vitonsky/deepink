/* eslint-disable spellcheck/spell-checker */
import { extendTheme } from '@chakra-ui/react';

import { basicTheme } from './basic';

export const darkTheme = extendTheme(basicTheme, {
	colors: {
		accent: {
			// Accent color
			100: '#e8e6ff',
			500: '#6b00cb',
			600: '#4e0095',
		},
		primary: {
			// Primary color for controls
			200: '#e6f0ff',
			300: '#d7e7ff',
			500: '#0066ff',
			700: '#3667b5',
		},
		typography: {
			primary: '#fff',
			secondary: '#c7c7c7',
			additional: '#ababab',
			ghost: '#6e6e6e',
		},
		surface: {
			background: '#000',
			panel: '#323232',
			border: '#565656',
			alternativeBorder: '#666666',
		},
		dim: {
			100: '#ffffff30',
			400: '#ffffff26',
		},
		link: {
			base: '#0066ff',
			hover: '#0453c9',
		},
		overlay: {
			500: '#ffffff75',
		},
	},
});
