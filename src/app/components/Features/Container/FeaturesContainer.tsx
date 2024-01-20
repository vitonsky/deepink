import React, { FC } from 'react';

import { IStackProps, Stack } from '../../Stack/Stack';

import { cnFeatures } from '../Features';

import './FeaturesContainer.css';

export interface FeaturesContainerProps extends Partial<IStackProps> {}

export const FeaturesContainer: FC<FeaturesContainerProps> = ({ children, ...rest }) => {
	return (
		<Stack
			direction="vertical"
			spacing={6}
			{...rest}
			className={cnFeatures('Container', [rest.className])}
		>
			{children}
		</Stack>
	);
};
