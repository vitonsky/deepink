/* eslint-disable spellcheck/spell-checker */
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
	StyleFunctionProps,
	SystemStyleObject,
} from '@chakra-ui/react';
import { NestedListTheme } from '@components/NestedList/NestedList.theme';
import { NotePreviewTheme } from '@components/NotePreview/NotePreview.theme';
import { NotificationsTheme } from '@components/Notifications/Notifications.theme';
import { RichEditorTheme } from '@features/NoteEditor/RichEditor/RichEditor.theme';

import { buildColorScheme } from './color';

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

// TODO: leave only one
// const accentColor = colord('#000000ff');
// const accentColor = colord('#ffa600ff');
// const accentColor = colord('#f400ff');
// const accentColor = colord('#0066ff');
const colors = buildColorScheme('#ffb107ff');

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

			'*::selection': {
				color: 'typography.inverted',
				backgroundColor: 'surface.selection',
			},

			'[data-resize-handle]': {
				'--resize-handle-active-color': 'var(--chakra-colors-primary-300)',
			},

			...getScrollBarStyles(),

			'select:focus-visible, button:focus-visible, input:focus-visible, ': {
				boxShadow: 'outline',
			},
		},
	},
	shadows: {
		outline: `0 0 0 3px ${colors.accent}`,
		input: `0 0 0 3px ${colors.accent}`,
	},
	colors: {
		primary: colors.primary,
		typography: {
			inverted: '#000',
			accent: colors.primary['700'],
			primary: '#e2e2e2',
			secondary: '#a7a59f',
		},
		surface: {
			background: '#48433f',
			invertedBackground: '#fff',
			panel: '#524c46',
			border: '#3a3633',
			selection: colors.primary['200'],
			highlight: colors.primary['300'],
		},
		dim: {
			50: '#6c65659c',
			100: '#6c6565b9',
			200: '#6c6565c6',
			400: '#6c65658a',
		},
		link: {
			base: colors.primary['400'],
			hover: colors.primary['600'],
		},
		overlay: {
			500: '#ffffff75',
		},
		message: {
			error: '#b30606',
		},
	},
	semanticTokens: {
		colors: {
			control: {
				base: {
					background: 'dim.50',
					foreground: 'typography.primary',

					active: {
						background: 'dim.100',
					},

					disabled: {
						background: 'dim.200',
					},
				},

				action: {
					foreground: 'primary.900',
					background: 'primary.500',

					active: {
						background: 'primary.600',
					},
				},

				input: {
					background: 'dim.100',
					border: 'transparent',

					active: {
						border: 'dim.400',
					},
				},
				ghost: {
					foreground: 'typography.primary',
					background: 'transparent',

					hover: {
						foreground: 'typography.primary',
						background: 'dim.200',
					},

					active: {
						foreground: 'typography.primary',
						background: 'dim.200',
					},
				},
				option: {
					foreground: 'typography.primary',
					background: 'transparent',

					hover: {
						foreground: 'typography.primary',
						background: 'dim.400',
					},

					active: {
						foreground: 'typography.primary',
						background: 'dim.400',
					},
				},

				checkbox: {
					background: 'transparent',
					border: 'surface.border',

					active: {
						background: 'primary.300',
						foreground: 'primary.500',
						border: 'primary.300',
					},
				},
			},
			container: {
				head: {
					foreground: 'typography.primary',
					background: 'surface.panel',
				},

				message: {
					foreground: 'typography.primary',
					background: 'dim.100',
				},
			},
		},
		scheme: {
			alert: {
				text: '#fff',
				base: '#C53030',
				hover: '#9B2C2C',
			},
		},
	},
	components: {
		Text: defineStyleConfig({
			baseStyle: {
				color: 'typography.primary',
			},
		}),
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
					backgroundColor: 'control.ghost.background',

					'&:not([data-active]):is(:hover,:active,:focus)': {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
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
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
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
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
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
						backgroundColor: 'container.message.background',
						color: 'container.message.foreground',
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
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
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
		NotePreview: NotePreviewTheme,
		NestedList: NestedListTheme,
		RichEditor: RichEditorTheme,
	},
});
