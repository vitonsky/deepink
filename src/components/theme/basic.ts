/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
	StyleFunctionProps,
} from '@chakra-ui/react';
import { ModalScreenTheme } from '@components/ModalScreen/ModalScreen.theme';
import { NestedListTheme } from '@components/NestedList/NestedList.theme';
import { NotePreviewTheme } from '@components/NotePreview/NotePreview.theme';
import { NotificationsTheme } from '@components/Notifications/Notifications.theme';
import { RichEditorTheme } from '@features/NoteEditor/RichEditor/RichEditor.theme';

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
		// For horizontal scroll
		height: '10px',
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

			'select:focus-visible, button:focus-visible, input:focus-visible, ': {
				boxShadow: 'outline',
			},
		},
	},
	shadows: {
		outline: '0 0 0 3px #0066ffaa',
	},
	colors: {
		accent: {
			// Accent color
			100: '#e8e6ff',
			500: '#6b00cb',
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
		message: {
			error: '#b30606',
		},
	},
	semanticTokens: {
		schemes: {
			alert: {
				text: '#fff',
				base: '#C53030',
				hover: '#9B2C2C',
			},
		},
	},
	components: {
		Link: defineStyleConfig({
			baseStyle: {
				color: 'link.base',
				'&:hover, &:active': {
					color: 'link.hover',
				},
			},
		}),
		Button: defineStyleConfig({
			baseStyle: {
				transition: 'transform .20ms ease',
				'&:not(:disabled):active': {
					transform: 'scale(.95)',
				},
			},
			variants: {
				primary(props: StyleFunctionProps) {
					const scheme = props.theme.semanticTokens.schemes[props.colorScheme];
					const colors: {
						text: string;
						base: string;
						hover: string;
					} = scheme || {
						text: 'primary.500',
						base: 'primary.200',
						hover: 'primary.300',
					};

					return {
						backgroundColor: colors.base,
						color: colors.text,
						'&:hover': {
							backgroundColor: colors.hover,
						},
						'&:disabled, &:hover[disabled]': {
							backgroundColor: colors.base,
						},
					};
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
					'&:hover, &:active, &[data-active]': {
						backgroundColor: 'dim.400',
					},
				},
			},
			defaultProps: {
				variant: 'secondary',
				colorScheme: 'primary',
			},
		}),
		Menu: createMultiStyleConfigHelpers([
			'button',
			'list',
			'item',
		]).defineMultiStyleConfig({
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
						backgroundColor: 'accent.100',
						color: 'accent.500',
					},
				},
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
						borderColor: 'transparent',
						'&:hover': {
							borderColor: 'dim.400',
						},
						'&:focus-visible': {
							borderColor: 'transparent',
						},
						'&:not(:focus)': {
							backgroundColor: 'dim.100',
						},
					},
				},
				ghost: {
					field: {
						background: 'transparent',
					},
				},
			},
			defaultProps: {
				variant: 'filled',
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
		Divider: defineStyleConfig({
			baseStyle: {
				borderColor: 'surface.border',
			},
		}),
		Checkbox: createMultiStyleConfigHelpers([
			'control',
			'icon',
		]).defineMultiStyleConfig({
			baseStyle: {
				control: {
					borderColor: 'surface.border',
					'&[aria-checked=true], &[data-checked]': {
						color: 'primary.500',
						borderColor: 'primary.300',
						backgroundColor: 'primary.300',
					},
				},
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
		Notifications: NotificationsTheme,
		ModalScreen: ModalScreenTheme,
		NotePreview: NotePreviewTheme,
		NestedList: NestedListTheme,
		RichEditor: RichEditorTheme,
	},
});
