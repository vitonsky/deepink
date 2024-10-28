/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
} from '@chakra-ui/react';

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
		surface: {
			background: '#ffffff',
			panel: '#fdfdfd',
			border: '#e2e8f0',
		},
		dim: {
			50: '#f5f5f5',
			100: '#f3f3f3',
			// #e3e3e3
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
			500: '#0066ff',
		},
		primary2: {
			'50': '#E7FEE7',
			'100': '#BCFCBB',
			'200': '#91FA8F',
			'300': '#66F863',
			'400': '#3BF637',
			'500': '#10F40B',
			'600': '#0DC408',
			'700': '#0A9306',
			'800': '#066204',
			'900': '#033102',
		},
		primary: {
			50: '#E6EDFF',
			100: '#B8CBFF',
			200: '#8AAAFF',
			300: '#5C89FE',
			400: '#2F68FE',
			500: '#0146FE',
			600: '#0138CB',
			700: '#012A98',
			800: '#001C66',
			900: '#000E33',
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
					// '&:hover': {
					// 	backgroundColor: '#e8e6ff',
					// 	color: '#6b00cb',
					// },
					'&:hover': {
						backgroundColor: '#d7e7ff',
					},
				},
				secondary: {
					backgroundColor: 'dim.100',
					color: '#3e3d3d',
					// borderWidth: '1px',
					// borderColor: 'dim.400',
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
						// borderWidth: '1px',
						// borderColor: 'dim.400',
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
					// borderRadius: '6px',
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
							backgroundColor: '#e8e6ff',
							color: '#6b00cb',
						},
					},
				},
				secondary: {
					field: {
						backgroundColor: 'dim.100',
						color: '#3e3d3d',
						// borderWidth: '1px',
						// borderColor: 'dim.400',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
			},
		},
	},
});
