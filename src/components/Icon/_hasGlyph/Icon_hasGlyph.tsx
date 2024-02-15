import React from 'react';
import { cnIcon, IIconProps } from 'react-elegant-ui/esm/components/Icon/Icon';
import { withHOCConstructor } from 'react-elegant-ui/esm/lib/compose';

export type IIconModHasGlyph = {
	hasGlyph?: boolean;
};

export const withModHasGlyph = withHOCConstructor<IIconModHasGlyph, IIconProps>(
	{ matchProps: { hasGlyph: true }, matchOnlyProps: ['hasGlyph'] },
	(Component) => (props) =>
		(
			<Component
				{...props}
				className={cnIcon({ hasGlyph: true }, [props.className])}
			/>
		),
);
