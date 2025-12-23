/* eslint-disable spellcheck/spell-checker */
import { createMultiStyleConfigHelpers, extendTheme } from '@chakra-ui/react';

import { basicTheme, getScrollBarStyles } from './basic';

export const blackberryTheme = extendTheme(basicTheme, {
	styles: {
		global: {
			...getScrollBarStyles({
				trackColor: '#46293d',
			}),
		},
	},
	colors: {
		accent: {
			// Accent color
			100: '#ffe6ff',
			500: '#8c258c',
			600: '#4e0095',
		},
		primary: {
			// Primary color for controls
			200: '#e7d4ff',
			300: '#d2bcec',
			500: '#500050',
			700: '#e7d4ff',
		},
		typography: {
			primary: '#fff',
			secondary: '#c7c7c7',
			additional: '#ababab',
			ghost: '#bdbdbd',
		},
		surface: {
			background: '#362436',
			panel: '#381038',
			border: '#4e254e',
			alternativeBorder: '#ffffff',
		},
		dim: {
			50: '#ffffff24',
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
	semanticTokens: {
		variants: {
			ghost: {
				color: 'typography.primary',
				hoverFill: 'dim.400',

				active: {
					color: 'primary.200',
				},
			},
		},
	},
	components: {
		Input: createMultiStyleConfigHelpers([
			'field',
			'addon',
			'element',
		]).defineMultiStyleConfig({
			variants: {
				outline: {
					field: {
						backgroundColor: '#5c345c',
					},
				},
				filled: {
					field: {
						borderColor: 'surface.alternativeBorder',
						'&:not(:focus)': {
							backgroundColor: 'dim.100',
						},
					},
				},
			},
		}),
		NotePreview: createMultiStyleConfigHelpers([
			'root',
			'body',
			'title',
			'text',
			'meta',
		]).defineMultiStyleConfig({
			variants: {
				default: {
					meta: {
						color: 'typography.ghost',
						'[aria-selected=true] &': {
							color: '#000',
						},
					},
				},
			},
		}),
	},
});
