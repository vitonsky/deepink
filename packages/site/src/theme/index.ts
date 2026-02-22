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
			},
			nav: {
				display: 'inline-flex',
				fontSize: '0.9rem',
				px: '0.5rem',
				py: '0.5rem',
				borderRadius: '6px',
				fontWeight: '500',
				color: 'brand.navText',
				_hover: {
					color: 'black',
					bg: 'brand.navHover',
				},
			},
			logo: {
				display: 'inline-flex',
				gap: '0.3rem',
				fontSize: '1.3rem',
				fontWeight: 'bold',
				color: 'black',
				_hover: {
					color: 'black',
				},
			},
			'button-primary': {
				display: 'inline-block',
				fontSize: '18px',
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
				bg: 'black',
				color: 'white',
				_hover: {
					bg: '#1a1a1a',
					color: 'white',
				},
			},
			'button-secondary': {
				display: 'inline-block',
				fontSize: '18px',
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
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
					border: { value: '#fed5b2' },
					buttonSecondaryBg: { value: '#ffe7d3' },
					buttonSecondaryText: { value: '#754f2f' },
					navText: { value: '#262423' },
					navHover: { value: '#ffc29136' },
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
				'link.default': { value: '{colors.brand.primary}' },
				'link.hover': { value: '{colors.brand.primaryHover}' },
			},
		},
		recipes: {
			button: buttonRecipe,
			link: linkRecipe,
			text: textRecipe,
		},
	},
	globalCss: {
		body: {
			margin: 0,
			bg: 'bg.canvas',
			fontFamily: 'body',
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
