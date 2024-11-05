import { createMultiStyleConfigHelpers, extendTheme } from '@chakra-ui/react';

import { basicTheme, getScrollBarStyles } from './basic';

export const alternativeTheme = extendTheme(basicTheme, {
	styles: {
		global: {
			...getScrollBarStyles({
				trackColor: '#e7e0d9',
				scrollColor: '#bbac9d',
				scrollHoverColor: '#a99a8c',
			}),
		},
	},
	shadows: {
		outline: '0 0 0 3px #d3b97c8a',
	},
	colors: {
		accent: {
			// Accent color
			100: '#e5d8cb',
			500: '#493017',
		},
		primary: {
			// Primary color for controls
			200: '#dbc490',
			300: '#d3b97c',
			500: '#000',
			700: '#d3b97c',
		},
		typography: {
			primary: '#000',
			secondary: '#4e3a0c',
			additional: '#3e3d3d',
			ghost: '#6e6e6e',
		},
		surface: {
			background: '#fffaf3',
			panel: '#f8f2e9',
			contrastPanel: '#efe8de',
			border: '#e0d6c7',
			alternativeBorder: '#c0c4c9',
		},
		dim: {
			100: '#ece3da',
			400: '#e0d4c8',
		},
		link: {
			base: '#0066ff',
			hover: '#0453c9',
		},
		overlay: {
			500: '#00000075',
		},
	},
	components: {
		Input: createMultiStyleConfigHelpers([
			'field',
			'addon',
			'element',
		]).defineMultiStyleConfig({
			variants: {
				filled: {
					field: {
						backgroundColor: 'dim.100',
						borderColor: 'transparent',
						color: 'typography.primary',
						'&:hover, &:focus-visible': {
							borderColor: 'dim.400',
						},
					},
				},
			},
			defaultProps: {
				variant: 'filled',
			},
		}),
	},
});
