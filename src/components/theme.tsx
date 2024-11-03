/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
} from '@chakra-ui/react';

// TODO: optimize theme
export const theme = extendTheme({
	styles: {
		global: {
			fontFamily: `-apple-system,
			blinkmacsystemfont,
			'Segoe UI',
			'Noto Sans',
			helvetica,
			arial,
			sans-serif,
			'Apple Color Emoji',
			'Segoe UI Emoji'`,
		},
	},
	colors: {
		typography: {
			primary: '#000',
			secondary: '#727272',
		},
		surface: {
			// background: 'red',
			background: '#ffffff',
			panel: '#fdfdfd',
			border: '#e2e8f0',
		},
		dim: {
			50: '#f5f5f5',
			100: '#f3f3f3',
			400: '#e7e7e7',
		},
		link: {
			base: '#0066ff',
			hover: '#0453c9',
		},
		accent: {
			100: '#e8e6ff',
			500: '#6b00cb',
		},
		accent2: {
			200: '#e6f0ff',
			500: '#0066ff',
			700: '#3667b5',
		},
	},
	components: {
		Menu: defineStyleConfig({
			baseStyle: {
				item: {
					transitionDuration: '0s',
					'&:hover, &:focus': {
						bgColor: '#e6f0ff',
					},
				},
			},
		}),
		Button: defineStyleConfig({
			variants: {
				primary: {
					backgroundColor: '#e6f0ff',
					color: '#0066ff',
					'&:hover': {
						backgroundColor: '#d7e7ff',
					},
				},
				secondary: {
					backgroundColor: 'dim.100',
					color: '#3e3d3d',
					'&:hover': {
						backgroundColor: 'dim.400',
					},
				},
				ghost: {
					'&:hover': {
						backgroundColor: 'dim.400',
					},
				},
			},
			defaultProps: {
				variant: 'secondary',
			},
		}),
		Tag: createMultiStyleConfigHelpers(['container']).defineMultiStyleConfig({
			variants: {
				default: {
					container: {
						backgroundColor: 'dim.100',
						color: '#3e3d3d',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
				accent: {
					container: {
						backgroundColor: 'accent.100',
						color: 'accent.500',
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		NotePreview: createMultiStyleConfigHelpers([
			'root',
			'body',
			'title',
			'text',
			'meta',
		]).defineMultiStyleConfig({
			baseStyle: {
				root: {
					cursor: 'pointer',
					padding: '0.5rem',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					width: '100%',
					alignItems: 'start',
					gap: '0.6rem',
				},
				body: {
					gap: '0.2rem',
					alignItems: 'start',
				},
				title: {
					fontWeight: 'bold',
					fontSize: '18px',
				},
				text: {
					fontSize: '14px',
				},
				meta: {
					fontSize: '14px',
					width: '100%',
				},
			},
			variants: {
				default: {
					root: {
						'&:not([aria-selected=true]):hover': {
							backgroundColor: 'dim.100',
							color: '#3e3d3d',
						},

						_selected: {
							backgroundColor: 'accent.100',
							color: 'accent.500',
						},
					},
					meta: {
						color: '#444444',
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		NestedList: createMultiStyleConfigHelpers([
			'root',
			'item',
			'content',
			'group',
		]).defineMultiStyleConfig({
			baseStyle: {
				root: {
					margin: '0',
					paddingLeft: '0',
					listStyle: 'none',
					// eslint-disable-next-line spellcheck/spell-checker
					fontFamily: 'Arial, Helvetica, sans-serif',
					userSelect: 'none',
					'& &': {
						paddingStart: '.5rem',
					},
					w: '100%',
					gap: '0',
				},
				item: {
					w: '100%',
					lineHeight: '1.5rem',
					gap: '0',
				},
				content: {
					w: '100%',
				},
				group: {
					w: '100%',
					paddingStart: '.5rem',
				},
			},
			variants: {
				default: {
					content: {
						'&:not([aria-selected=true]):hover': {
							backgroundColor: 'dim.100',
							color: '#3e3d3d',
						},

						_selected: {
							backgroundColor: 'accent.100',
							color: 'accent.500',
						},
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		Tabs: createMultiStyleConfigHelpers(['tab']).defineMultiStyleConfig({
			variants: {
				default: {
					tab: {
						color: 'typography.primary',

						'&:hover': {
							backgroundColor: 'dim.100',
							color: '#3e3d3d',
						},
						_selected: {
							backgroundColor: 'accent.100',
							color: 'accent.500',
							'&:hover': {
								color: 'accent.500',
								backgroundColor: 'accent.100',
							},
						},
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		Select: {
			variants: {
				primary: {
					field: {
						backgroundColor: '#e6f0ff',
						color: '#0066ff',
						'&:hover': {
							backgroundColor: '#d7e7ff',
						},
					},
					icon: {
						color: '#0066ff',
					},
				},
				secondary: {
					field: {
						backgroundColor: 'dim.100',
						color: '#3e3d3d',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
			},
		},
	},
});
