import React, { FC, PropsWithChildren } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

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
		<Box
			w="100%"
			sx={{
				display: 'grid',
				gridTemplateColumns: '40% auto',
				gridRowGap: '50rem',
			}}
		>
			<Text
				sx={{
					display: 'flex',
					justifyContent: 'end',
					// alignItems: 'center',
					lineHeight: '120%',
					paddingTop: '.8rem',
					paddingInlineEnd: '1rem',
				}}
			>
				{title}
			</Text>
			<VStack alignItems="baseline">
				{children}
				{description && (
					<Text
						sx={{
							fontSize: '0.9rem',
							color: 'gray',
							lineHeight: '140%',
						}}
					>
						{description}
					</Text>
				)}
			</VStack>
		</Box>
	);
};
