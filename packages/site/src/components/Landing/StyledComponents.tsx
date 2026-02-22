import React from 'react';
import { chakra } from '@chakra-ui/react';

import { system } from '../../theme';

// Create wrapper components that use our custom recipes
// These will properly type-check with our variant definitions

export const Link = React.forwardRef<
	HTMLAnchorElement,
	React.ComponentProps<typeof chakra.a> & {
		variant?: 'default' | 'nav' | 'logo' | 'button-primary' | 'button-secondary';
	}
>((props, ref) => {
	const { variant = 'default', ...rest } = props;
	const recipe = system._config.theme?.recipes?.link;
	const styles = recipe ? system.cva(recipe)({ variant }) : {};

	return <chakra.a ref={ref} {...styles} {...rest} />;
});

Link.displayName = 'Link';

export const Text = React.forwardRef<
	HTMLParagraphElement,
	React.ComponentProps<typeof chakra.p> & {
		variant?: 'body' | 'description' | 'hero' | 'feature' | 'intro';
	}
>((props, ref) => {
	const { variant = 'body', ...rest } = props;
	const recipe = system._config.theme?.recipes?.text;
	const styles = recipe ? system.cva(recipe)({ variant }) : {};

	return <chakra.p ref={ref} {...styles} {...rest} />;
});

Text.displayName = 'Text';
