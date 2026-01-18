import { getScrollBarStyles } from '../base';

export default {
	styles: {
		global: {
			...getScrollBarStyles(),
		},
	},
	shadows: {
		outline: '0 0 0 3px #0066ff',
		input: '0 0 0 3px #0066ff',
	},
	colors: {
		accent: {
			// Accent color
			100: '#e6f0ff',
			200: '#d7e7ff',
			500: '#0066ff',
		},
		primary: {
			// Primary color for controls
			200: '#000',
			300: '#313131ff',
			500: '#f0f0f0',
			700: '#000',
		},
		typography: {
			primary: '#000',
			inverted: '#fff',
			secondary: '#5f5f5f',
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
					foreground: 'typography.primary',
					background: '#f0f0f0',

					active: {
						foreground: '#000',
						background: '#f0f0f0',
					},
				},
				option: {
					foreground: 'typography.primary',
					accentForeground: 'typography.primary',
					additionalForeground: '#33435e',

					hover: {
						background: '#f0f0f0',
					},
					active: {
						background: '#f0f0f0',
						accentForeground: 'typography.primary',
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
		scheme: {
			alert: {
				text: '#fff',
				base: '#C53030',
				hover: '#9B2C2C',
			},
		},
	},
};
