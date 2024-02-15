import React, { FC, PropsWithChildren } from 'react';

import { Stack } from '../../Stack/Stack';

import { cnFeatures } from '../Features';

import './FeaturesOption.css';

export type FeaturesOptionProps = PropsWithChildren<{
	title?: string;
	description?: string;
}>;

export const FeaturesOption: FC<FeaturesOptionProps> = ({
	title,
	description,
	children,
}) => {
	return (
		<Stack direction="vertical" spacing={2} className={cnFeatures('Option')}>
			<div className={cnFeatures('OptionTitle')}>{title}</div>
			<Stack
				direction="vertical"
				spacing={2}
				className={cnFeatures('OptionContent')}
			>
				{children}
				{description && (
					<div className={cnFeatures('OptionDescription')}>{description}</div>
				)}
			</Stack>
		</Stack>
	);
};
