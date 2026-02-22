/* eslint-disable @cspell/spellchecker */
import {
	createSystem,
	defaultConfig,
	defineConfig,
	defineRecipe,
} from '@chakra-ui/react';

// Button recipe with variants
const buttonRecipe = defineRecipe({
	base: {
		display: 'inline-block',
		fontSize: '18px',
		px: '1.4rem',
		py: '0.7rem',
		borderRadius: '8px',
		fontWeight: '500',
		textDecoration: 'none',
		cursor: 'pointer',
	},
	variants: {
		variant: {
			primary: {
				bg: 'black',
				color: 'white',
				_hover: {
					bg: '#1a1a1a',
					color: 'white',
				},
			},
			secondary: {
				bg: 'brand.buttonSecondaryBg',
				color: 'brand.buttonSecondaryText',
				_hover: {
					bg: '#ffd5ad',
					color: 'brand.buttonSecondaryText',
				},
			},
		},
	},
	defaultVariants: {
		variant: 'primary',
	},
});

// Link recipe with variants
const linkRecipe = defineRecipe({
	base: {
		textDecoration: 'none',
		cursor: 'pointer',
	},
	variants: {
		variant: {
			default: {
				color: 'link.default',
				_hover: {
					color: 'link.hover',
				},
				display: 'inline-block',
			},
			plain: {
				color: 'black',
				textDecoration: 'none',
				_hover: {
					textDecoration: 'none',
					color: 'black',
				},
			},
			nav: {
				display: 'inline-flex',
				userSelect: 'none',
				fontSize: '0.9rem',
				padding: '.4rem .5rem',
				borderRadius: '6px',
				fontWeight: '500',
				color: '#262423',
				_hover: {
					bg: '#ffe2cb',
					color: 'brand.buttonSecondaryText',
				},
			},
			'button-primary': {
				display: 'inline-block',
				userSelect: 'none',
				fontSize: '18px',
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
				bg: '#df560e',
				color: 'white',
				_hover: {
					bg: '#ee5708',
					color: 'white',
				},
			},
			'button-secondary': {
				display: 'inline-block',
				userSelect: 'none',
				fontSize: '18px',
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
				bg: 'brand.buttonSecondaryBg',
				color: 'brand.buttonSecondaryText',
				_hover: {
					bg: '#ffe2cb',
					color: 'brand.buttonSecondaryText',
				},
			},
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

// Text recipe with variants
const textRecipe = defineRecipe({
	base: {
		margin: 0,
	},
	variants: {
		variant: {
			body: {
				fontFamily: 'body',
			},
			description: {
				fontFamily: 'body',
				color: 'brand.secondary',
			},
			hero: {
				fontSize: '20px',
				color: 'brand.secondary',
			},
			feature: {
				fontSize: '18px',
				color: 'brand.secondary',
			},
			intro: {
				fontSize: '22px',
				color: 'brand.secondary',
			},
		},
	},
	defaultVariants: {
		variant: 'body',
	},
});

const customConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				bg: {
					canvas: { value: '#fff6eb' },
					image: { value: '#ffe7d3' },
				},
				brand: {
					primary: { value: '#b55d0e' },
					primaryHover: { value: '#f36e02' },
					secondary: { value: '#654c3d' },
					buttonSecondaryBg: { value: '#ffe7d3' },
					buttonSecondaryText: { value: '#754f2f' },
					heroHeader: { value: '#321e04' },
					hrBorder: { value: '#f4e5dd' },
				},
			},
			fonts: {
				body: {
					value: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, Inter, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
				},
			},
		},
		semanticTokens: {
			colors: {
				'color-palette-focus-ring': {
					value: '{colors.orange.500}',
				},

				'link.default': { value: '{colors.brand.primary}' },
				'link.hover': { value: '{colors.brand.primaryHover}' },
				border: {
					thin: { value: '#f6e8d5' },
					contrast: { value: '#ffdbbd' },
				},
			},
		},
		recipes: {
			button: buttonRecipe,
			link: linkRecipe,
			text: textRecipe,
			separator: defineRecipe({
				base: {
					borderColor: 'border.thin',
				},
			}),
		},
	},
	globalCss: {
		'::selection': {
			bg: '#ffe7d3',
			color: '#b55d0e',
		},
		':root': {
			bg: 'bg.canvas',
			fontFamily: 'body',
		},
		body: {
			margin: 0,
		},
		img: {
			maxWidth: '100%',
			bg: 'bg.image',
		},
		a: {
			textDecoration: 'none',
			color: 'link.default',
			_hover: {
				color: 'link.hover',
			},
		},
		hr: {
			border: 0,
			borderBottom: '1px solid',
			borderColor: 'brand.hrBorder',
		},
	},
});

export const system = createSystem(defaultConfig, customConfig);
