/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
	StyleFunctionProps,
	SystemStyleObject,
} from '@chakra-ui/react';
import { ModalScreenTheme } from '@components/ModalScreen/ModalScreen.theme';
import { NestedListTheme } from '@components/NestedList/NestedList.theme';
import { NotePreviewTheme } from '@components/NotePreview/NotePreview.theme';
import { NotificationsTheme } from '@components/Notifications/Notifications.theme';
import { RichEditorTheme } from '@features/NoteEditor/RichEditor/RichEditor.theme';

import './resizable-panels.css';

export const getScrollBarStyles = ({
	trackColor = '#f1f1f1',
	scrollColor = '#c5c5c5',
	scrollHoverColor = '#939393',
}: {
	trackColor?: string;
	scrollColor?: string;
	scrollHoverColor?: string;
} = {}) => {
	const styles: SystemStyleObject = {
		'.invisible-scroll::-webkit-scrollbar': {
			display: 'none',
		},
	};

	// Disable custom scrolls for some environments
	if (navigator.userAgent.includes('Mac OS')) return styles;

	// TODO: automatically hide scroll bar when not needed
	return {
		...styles,

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
	} satisfies SystemStyleObject;
};

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

			'::selection': {
				backgroundColor: 'surface.selection',
			},

			'[data-resize-handle]': {
				'--resize-handle-active-color': 'var(--chakra-colors-accent-500)',
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
			inverted: '#fff',
			secondary: '#727272',
			additional: '#3e3d3d',
			ghost: '#6e6e6e',
		},
		surface: {
			background: '#ffffff',
			invertedBackground: '#000',
			panel: '#fdfdfd',
			contrastPanel: '#f7f7f7',
			border: '#e2e8f0',
			alternativeBorder: '#c0c4c9',
			selection: '#d7e7ff',
			highlight: '#b0d0ff',
		},
		dim: {
			50: '#fbfbfb',
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
		scheme: {
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
				'&:not([data-no-animation])': {
					transition: 'transform .20ms ease',
					'&:not(:disabled):active': {
						transform: 'scale(.95)',
					},
				},
			},
			variants: {
				primary(props: StyleFunctionProps) {
					const scheme = props.theme.semanticTokens.scheme[props.colorScheme];
					const colors: {
						text: string;
						base: string;
						hover: string;
					} = scheme || {
						text: 'control.action.foreground',
						base: 'control.action.background',
						hover: 'control.action.active.background',
					};

					return {
						color: colors.text,
						backgroundColor: colors.base,

						'&:hover': {
							backgroundColor: colors.hover,
						},
						'&:disabled, &:hover[disabled]': {
							backgroundColor: colors.base,
						},
					};
				},

				secondary: {
					color: 'control.base.foreground',
					backgroundColor: 'control.base.background',

					'&[disabled], &:hover, &[disabled]:hover': {
						backgroundColor: 'control.base.disabled.background',
					},
					'&[data-active], &:not([disabled]):hover': {
						backgroundColor: 'control.base.active.background',
					},
				},

				ghost: {
					color: 'control.ghost.foreground',
					backgroundColor: 'transparent',

					'&:not([data-active]):is(:hover,:active,:focus)': {
						backgroundColor: 'control.ghost.background',
					},

					'&[data-active]': {
						color: 'control.ghost.active.foreground',
						background: 'control.ghost.active.background',
					},
				},

				link: {
					color: 'link.base',
					backgroundColor: 'unset',

					textDecoration: 'underline',
					textUnderlineOffset: '.2em',
					padding: 0,
					fontWeight: 'normal',
					fontSize: 'inherit',
					alignItems: 'baseline',

					'&:hover, &:active, &[data-active]': {
						color: 'link.base',
					},
					'&:not(:disabled):active': {
						transform: 'none',
					},
				},
			},
			defaultProps: {
				variant: 'secondary',
				colorScheme: 'primary',
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
						color: 'typography.secondary',
						opacity: '.8',
					},

					'&:focus-visible, &[data-focus-visible]': {
						shadow: 'input',
					},
				},
			},
			sizes: {
				lg: {
					field: {
						borderWidth: '2px',
					},
				},
			},
			variants: {
				subtle: {
					field: {
						borderColor: 'control.input.border',
						borderWidth: '1px',

						'&:hover': {
							borderColor: 'control.input.active.border',
						},
						'&:focus': {
							borderColor: 'control.input.border',
							backgroundColor: 'transparent',
						},
						'&:not(:focus)': {
							backgroundColor: 'control.input.background',
						},
					},
				},
				flushed: {
					field: {
						background: 'transparent',
						boxShadow: 'none',
						padding: '.3rem',

						borderWidth: '0 0 1px',
						borderColor: 'transparent',
						borderRadius: 0,

						'&:hover, &:focus, &:focus-visible': {
							background: 'transparent',
							borderColor: 'control.input.active.border',
						},
						'&:focus-visible': {
							boxShadow: 'none',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
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
				subtle: {
					field: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',

						'&:hover': {
							backgroundColor: 'control.base.active.background',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Switch: createMultiStyleConfigHelpers([
			'container',
			'thumb',
			'track',
		]).defineMultiStyleConfig({
			baseStyle: {
				track: {
					backgroundColor: 'control.action.background',
				},
				thumb: {
					backgroundColor: 'control.action.foreground',
				},
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
					color: 'control.ghost.foreground',
					backgroundColor: 'transparent',

					transitionDuration: '0s',
					'&:hover, &:focus': {
						backgroundColor: 'control.ghost.background',
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
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						'&[aria-selected=true]': {
							backgroundColor: 'control.ghost.background',
						},
					},
				},
			},
		),
		Tooltip: defineStyleConfig({
			baseStyle: {
				borderRadius: '4px',
				color: 'typography.inverted',
				backgroundColor: 'surface.invertedBackground',
				'--popper-arrow-bg': 'var(--chakra-colors-surface-invertedBackground)',
			},
		}),
		Tag: createMultiStyleConfigHelpers(['container']).defineMultiStyleConfig({
			variants: {
				base: {
					container: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',

						'&:hover': {
							backgroundColor: 'control.base.active.background',
						},
					},
				},
				static: {
					container: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',
					},
				},
			},
			defaultProps: {
				variant: 'base',
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
						backgroundColor: 'panel.message.background',
						color: 'panel.message.foreground',
					},
				},
			},
		}),
		Tabs: createMultiStyleConfigHelpers(['tab']).defineMultiStyleConfig({
			variants: {
				subtle: {
					tab: {
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						'&:hover': {
							backgroundColor: 'control.ghost.background',
						},

						_selected: {
							color: 'control.ghost.active.foreground',
							background: 'control.ghost.active.background',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Spinner: defineStyleConfig({
			variants: {
				accent: {
					color: 'control.action.foreground',
				},
			},
			defaultProps: {
				variant: 'accent',
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
					backgroundColor: 'control.checkbox.background',
					borderColor: 'control.checkbox.border',

					_checked: {
						'&, &:hover': {
							color: 'control.checkbox.active.foreground',
							borderColor: 'control.checkbox.active.border',
							backgroundColor: 'control.checkbox.active.background',
						},
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
