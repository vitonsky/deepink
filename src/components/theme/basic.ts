/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
} from '@chakra-ui/react';

export const getScrollBarStyles = ({
	trackColor = '#f1f1f1',
	scrollColor = '#c5c5c5',
	scrollHoverColor = '#939393',
}: {
	trackColor?: string;
	scrollColor?: string;
	scrollHoverColor?: string;
} = {}) => ({
	'::-webkit-scrollbar': {
		width: '10px',
	},

	'::-webkit-scrollbar-track': {
		background: trackColor,
		borderRadius: '0px',
		border: '1px solid transparent',
	},

	'::-webkit-scrollbar-thumb': {
		background: scrollColor,
		borderRadius: '0px',
		border: '0px solid transparent',
		backgroundClip: 'padding-box',
	},

	'::-webkit-scrollbar-thumb:hover': {
		background: scrollHoverColor,
	},
});

export const basicTheme = extendTheme({
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

			body: {
				background: 'surface.background',
				margin: 0,
			},

			...getScrollBarStyles(),
		},
	},
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
			primary: '#000',
			secondary: '#727272',
			additional: '#3e3d3d',
			ghost: '#6e6e6e',
		},
		surface: {
			background: '#ffffff',
			panel: '#fdfdfd',
			contrastPanel: '#f7f7f7',
			border: '#e2e8f0',
			alternativeBorder: '#c0c4c9',
		},
		dim: {
			100: '#f3f3f3',
			400: '#e7e7e7',
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
		Menu: createMultiStyleConfigHelpers(['list', 'item']).defineMultiStyleConfig({
			baseStyle: {
				list: {
					borderColor: 'surface.border',
					backgroundColor: 'surface.background',
				},
				item: {
					color: 'typography.primary',
					backgroundColor: 'surface.background',

					transitionDuration: '0s',
					'&:hover, &:focus': {
						backgroundColor: 'dim.100',
					},
				},
			},
		}),
		List: createMultiStyleConfigHelpers(['container', 'item']).defineMultiStyleConfig(
			{
				baseStyle: {
					list: {
						borderColor: 'surface.border',
						backgroundColor: 'surface.background',
					},
					item: {
						color: 'typography.primary',

						'&[aria-selected=true]': {
							backgroundColor: 'dim.100',
						},
					},
				},
			},
		),
		Button: defineStyleConfig({
			variants: {
				primary: {
					backgroundColor: 'primary.200',
					color: 'primary.500',
					'&:hover': {
						backgroundColor: 'primary.300',
					},
				},
				secondary: {
					backgroundColor: 'dim.100',
					color: 'typography.primary',
					'&:hover': {
						backgroundColor: 'dim.400',
					},
				},
				ghost: {
					color: 'typography.primary',
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
						color: 'typography.additional',
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
		Alert: createMultiStyleConfigHelpers([
			'icon',
			'container',
		]).defineMultiStyleConfig({
			baseStyle: {
				icon: {
					color: 'currentColor',
				},
				container: {
					'&[data-status="info"]': {
						backgroundColor: 'primary.200',
						color: 'primary.500',
					},
				},
			},
		}),
		Notifications: createMultiStyleConfigHelpers([
			'root',
			'head',
			'body',
		]).defineMultiStyleConfig({
			baseStyle: {
				root: {
					position: 'absolute',
					bottom: '2rem',
					right: '0.5rem',
					backgroundColor: 'surface.background',
					border: '2px solid #eee',
					borderRadius: '4px',
					minWidth: '300px',
					maxWidth: '500px',
					maxHeight: '500px',
					boxShadow: '0 5px 30px -20px black',
				},
				head: {
					w: '100%',
					padding: '.5rem 1rem',
					backgroundColor: 'surface.contrastPanel',
				},
				body: {
					w: '100%',
					alignItems: 'start',
					padding: '1rem',
				},
			},
		}),
		ModalScreen: createMultiStyleConfigHelpers([
			'root',
			'head',
			'body',
			'content',
		]).defineMultiStyleConfig({
			baseStyle: {
				head: {
					position: 'sticky',
					top: '0',
					width: '100%',
					padding: '.3rem 1rem',
					backgroundColor: 'surface.contrastPanel',
					borderBottom: '1px solid',
					borderColor: 'surface.border',
				},
				body: {
					display: 'flex',
					flex: '1',
					width: '100%',
					justifyContent: 'center',
				},
				content: {
					maxWidth: '800px',
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
						color: 'typography.primary',

						'&:not([aria-selected=true]):hover': {
							backgroundColor: 'dim.100',
						},

						_selected: {
							backgroundColor: 'accent.100',
							color: 'accent.500',
						},
					},
					meta: {
						color: 'typography.ghost',
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
						color: 'typography.primary',

						'&:not([aria-selected=true]):hover': {
							backgroundColor: 'dim.100',
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
						color: 'typography.additional',

						'&:hover': {
							backgroundColor: 'dim.100',
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
		Input: createMultiStyleConfigHelpers([
			'field',
			'addon',
			'element',
		]).defineMultiStyleConfig({
			baseStyle: {
				field: {
					color: 'typography.primary',
					'&::placeholder': {
						color: 'inherit',
						opacity: '.6',
					},
				},
			},
			variants: {
				outline: {
					field: {
						borderColor: 'surface.border',
						'&:not(:focus):hover': {
							borderColor: 'surface.alternativeBorder',
						},
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
			defaultProps: {
				variant: 'outline',
			},
		}),
		Select: createMultiStyleConfigHelpers(['field', 'icon']).defineMultiStyleConfig({
			baseStyle: {
				field: {
					color: 'typography.primary',
					'&::placeholder': {
						color: 'inherit',
						opacity: '.8',
					},
				},
			},
			variants: {
				outline: {
					field: {
						'&, & >option': {
							backgroundColor: 'surface.background',
						},

						borderColor: 'surface.border',
						'&:not(:focus):hover': {
							borderColor: 'surface.alternativeBorder',
						},
					},
				},
				primary: {
					field: {
						backgroundColor: 'primary.200',
						color: 'primary.500',
						'&:hover': {
							backgroundColor: 'primary.300',
						},
					},
					icon: {
						color: 'primary.500',
					},
				},
				secondary: {
					field: {
						backgroundColor: 'dim.100',
						color: 'typography.primary',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
			},
			defaultProps: {
				variant: 'outline',
			},
		}),
		Spinner: defineStyleConfig({
			variants: {
				primary: {
					color: 'primary.500',
				},
			},
			defaultProps: {
				variant: 'primary',
			},
		}),
		Modal: createMultiStyleConfigHelpers([
			'overlay',
			'dialog',
		]).defineMultiStyleConfig({
			baseStyle: {
				overlay: {
					backgroundColor: 'overlay.500',
				},
				dialog: {
					color: 'typography.primary',
					backgroundColor: 'surface.background',
				},
			},
		}),
	},
});
