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
				base: '#000',
				secondary: '#5f5f5f',
				inverted: '#fff',
			},
			selection: {
				foreground: '#fff',
				base: colors.accentVariants['200'],
				highlight: colors.accentVariants['300'],
			},
			surface: {
				background: '#ffffff',
				invertedBackground: '#000',
				panel: '#fdfdfd',
				border: '#e2e8f0',
			},
			dim: {
				50: '#fbfbfb',
				100: '#f3f3f3',
				200: '#edededff',
				400: '#e7e7e7',
			},
			link: {
				base: colors.accentVariants['400'],
				hover: colors.accentVariants['600'],
			},
			overlay: {
				500: '#00000075',
			},
			message: {
				error: '#b30606',
			},
		},
		semanticTokens: {
			colors: {
				control: {
					base: {
						background: 'dim.100',
						foreground: 'typography.base',

						active: {
							background: 'dim.400',
						},

						disabled: {
							background: 'dim.100',
						},
					},

					action: {
						foreground: 'accent.500',
						background: 'accent.100',

						active: {
							background: 'accent.200',
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
							background: 'dim.200',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.200',
						},
					},

					checkbox: {
						background: 'transparent',
						border: 'surface.border',

						active: {
							foreground: 'accent.500',
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
