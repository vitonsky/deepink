import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { IStackProps, Stack } from '../Stack/Stack';

export const cnFeatures = cn('Features');

export interface FeaturesProps extends Partial<IStackProps> {}

export const Features: FC<FeaturesProps> = ({ children, ...rest }) => {
	return (
		<Stack direction="vertical" spacing={6} {...rest} className={cnFeatures()}>
			{children}
		</Stack>
	);
};
