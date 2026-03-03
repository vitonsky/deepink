import React from 'react';
import { chakra } from '@chakra-ui/react';

import { system } from '../theme';

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
