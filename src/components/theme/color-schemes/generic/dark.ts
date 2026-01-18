/* eslint-disable spellcheck/spell-checker */

import { getScrollBarStyles } from '../../base';
import { buildColorScheme } from '../../color';

export default function (accentColor: string) {
	const colors = buildColorScheme(accentColor);

	return {
		styles: {
			global: {
				...getScrollBarStyles(),
			},
		},
		shadows: {
			outline: `0 0 0 3px ${colors.accent}`,
			input: `0 0 0 3px ${colors.accent}`,
		},
		colors: {
			accent: colors.accentVariants,
			typography: {
				base: '#e2e2e2',
				secondary: '#a7a59f',
				inverted: '#000',
			},
			selection: {
				foreground: '#000',
				base: colors.accentVariants['200'],
				highlight: colors.accentVariants['300'],
			},
			surface: {
				background: '#48433f',
				invertedBackground: '#fff',
				panel: '#524c46',
				border: '#3a3633',
			},
			dim: {
				50: '#6c65659c',
				100: '#6c6565b9',
				200: '#6c6565c6',
				400: '#6c65658a',
			},
			link: {
				base: colors.accentVariants['400'],
				hover: colors.accentVariants['600'],
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
						foreground: 'typography.base',

						active: {
							background: 'dim.100',
						},

						disabled: {
							background: 'dim.200',
						},
					},

					action: {
						foreground: 'accent.900',
						background: 'accent.500',

						active: {
							background: 'accent.600',
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
						foreground: 'typography.base',
						background: 'transparent',

						hover: {
							foreground: 'typography.base',
							background: 'dim.200',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.200',
						},
					},
					option: {
						foreground: 'typography.base',
						background: 'transparent',

						hover: {
							foreground: 'typography.base',
							background: 'dim.400',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.400',
						},
					},

					checkbox: {
						background: 'transparent',
						border: 'dim.50',

						active: {
							foreground: 'accent.900',
							background: 'accent.300',
							border: 'accent.300',
						},
					},
				},
				container: {
					head: {
						foreground: 'typography.base',
						background: 'surface.panel',
					},

					message: {
						foreground: 'typography.base',
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
	};
}
