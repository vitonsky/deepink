import React, { useMemo } from 'react';
import { IIconProps } from 'react-elegant-ui/esm/components/Icon/Icon';
import { withHOCConstructor } from 'react-elegant-ui/esm/lib/compose';

export type IIconModBoxSize = {
	boxSize?: string;
};

export const withModBoxSize = withHOCConstructor<IIconModBoxSize, IIconProps>(
	{},
	(Component) =>
		({ boxSize, ...props }) => {
			const style = useMemo(
				() => ({
					...(boxSize
						? {
								minWidth: boxSize,
								minHeight: boxSize,
						  }
						: {}),
					...props.style,
				}),
				[boxSize, props.style],
			);

			return <Component {...props} style={style} />;
		},
);
