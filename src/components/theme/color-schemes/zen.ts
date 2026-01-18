import { getScrollBarStyles } from '../base';

export default {
	styles: {
		global: {
			...getScrollBarStyles({
				trackColor: '#e7e0d9',
				scrollColor: '#bbac9d',
				scrollHoverColor: '#a99a8c',
			}),
		},
	},
	shadows: {
		input: '0 0 0 3px #bea56b',
		outline: '0 0 0 3px #000000',
	},
	colors: {
		accent: {
			// Accent color
			100: '#e5d8cb',
			500: '#493017',
		},
		primary: {
			// Primary color for controls
			100: '#ddccbd',
			200: '#ffd5b2',
			300: '#f9caa2',
			500: '#94481c',
			700: '#ae7f5f',
		},

		typography: {
			primary: '#000',
			secondary: '#4e3a0c',
			accent: '#493017',
			additional: '#3e3d3d',
			ghost: '#3a3a3a',
		},
		surface: {
			background: '#fffaf3',
			panel: '#f8f2e9',
			contrastPanel: '#efe8de',
			border: '#e0d6c7',
			alternativeBorder: '#c0c4c9',
			selection: '#ffca9b',
			highlight: '#ffba7d',
		},
		dim: {
			50: '#fdf4ea',
			100: '#f7ece1',
			400: '#f4e6d8',
		},

		link: {
			base: 'typography.accent',
			hover: 'typography.additional',
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
					foreground: 'typography.primary',

					active: {
						background: 'dim.400',
					},

					disabled: {
						background: 'dim.100',
					},
				},

				action: {
					foreground: 'primary.500',
					background: 'primary.200',

					active: {
						background: 'primary.300',
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
					foreground: '#57381b',
					background: '#f5e8dd',

					active: {
						foreground: '#93561d',
						background: '#f7e4d3',
					},
				},

				option: {
					foreground: 'typography.primary',
					accentForeground: '#57381b',
					additionalForeground: '#33435e',

					hover: {
						background: '#f5e8dd',
					},
					active: {
						background: '#f7e4d3',
						accentForeground: '#93561d',
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
					foreground: 'accent.500',
					background: 'accent.100',
				},
			},
		},
	},
};
