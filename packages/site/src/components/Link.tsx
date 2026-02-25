import React from 'react';
import { chakra, defineRecipe, type RecipeDefinition } from '@chakra-ui/react';

import { system } from '../theme';

// Create wrapper components that use our custom recipes
// These will properly type-check with our variant definitions

export const linkRecipe = defineRecipe({
	base: {
		textDecoration: 'none',
		cursor: 'pointer',
		boxSizing: 'border-box',
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
			native: {
				color: 'inherit',
				textDecoration: 'underline',
				_hover: {
					color: 'link.hover',
				},
			},
			header: {
				color: 'inherit',
				_hover: {
					textDecoration: 'underline',
					color: 'link.hover',
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

export const Link = React.forwardRef<
	HTMLAnchorElement,
	React.ComponentProps<typeof chakra.a> & {
		variant?: typeof linkRecipe extends RecipeDefinition<infer X>
			? keyof X['variant']
			: never;
	}
>((props, ref) => {
	const { variant = 'default', ...rest } = props;
	const recipe = system._config.theme?.recipes?.link;
	const styles = recipe ? system.cva(recipe)({ variant }) : {};

	return <chakra.a ref={ref} {...styles} {...rest} />;
});
Link.displayName = 'Link';
