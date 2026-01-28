import React, { FC } from 'react';
import { Text, TextProps } from '@chakra-ui/react';

export interface FeaturesHeaderProps extends TextProps {
	view?: 'section' | 'group' | 'primary';
}

export const FeaturesHeader: FC<FeaturesHeaderProps> = ({
	children,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	view = 'section',
	...rest
}) => {
	return (
		<Text
			as="h2"
			{...rest}
			sx={{
				marginLeft: '40%',
				fontSize: '18px',
				fontWeight: 'bold',
				'&:not(:first-child)': {
					marginTop: '2rem',
				},
				...rest.sx,
			}}
		>
			{children}
		</Text>
	);
};
