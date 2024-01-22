import React, { FC, HTMLAttributes } from 'react';

import { cnFeatures } from '../Features';

import './FeaturesHeader.css';

export interface FeaturesHeaderProps extends HTMLAttributes<HTMLHeadingElement> {
	view?: 'section' | 'group' | 'primary';
}

export const FeaturesHeader: FC<FeaturesHeaderProps> = ({
	children,
	view = 'section',
	...rest
}) => {
	return (
		<h2 {...rest} className={cnFeatures('Header', { view }, [rest.className])}>
			{children}
		</h2>
	);
};
