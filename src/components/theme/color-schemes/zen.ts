import { getScrollBarStyles } from '../base';

export default {
	styles: {
		global: {
			...getScrollBarStyles({
				trackColor: '#ede5da',
				scrollColor: '#c4ae97',
				scrollHoverColor: '#a8917a',
			}),
		},
	},
	shadows: {
		input: '0 0 0 3px #e8c49a',
		outline: '0 0 0 3px #e8c49a',
	},
	colors: {
		accent: {
			100: '#f5ede2',
			200: '#ecd5b8',
			300: '#d9b48a',
			500: '#a0622e',
			700: '#7a4520',
		},
		typography: {
			base: '#1a1008',
			secondary: '#7a5c3a',
			inverted: '#fff',
		},
		selection: {
			foreground: '#1a1008',
			background: '#f0c98a',
		},
		highlight: {
			foreground: '#1a1008',
			background: '#e8b870',
		},
		surface: {
			background: '#fdf8f0',
			invertedBackground: '#1a1008',
			panel: '#f5ede0',
			border: '#ddd0bc',
		},
		dim: {
			50: '#c8955010',
			100: '#c8955018',
			200: '#c8955028',
			400: '#c895503a',
			500: '#c895504f',
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
			link: {
				base: 'accent.500',
				hover: 'accent.700',
			},

			control: {
				base: {
					background: 'dim.200',
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
					background: 'accent.200',

					active: {
						background: 'accent.300',
					},
				},

				input: {
					background: 'dim.100',
					border: 'transparent',

					active: {
						border: 'dim.500',
					},
				},
				ghost: {
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
			code: {
				token: {
					comment: '#9e7355',
					punctuation: '#8a5c2a',
					property: '#a04010',
					selector: '#a04010',
					operator: '#c44010',
					attr: '#b03808',
					variable: '#c07010',
					function: '#c07010',
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
