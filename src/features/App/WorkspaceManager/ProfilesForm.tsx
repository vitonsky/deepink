import React, { PropsWithChildren, ReactNode } from 'react';
import { Text, VStack } from '@chakra-ui/react';

export type ProfilesFormProps = PropsWithChildren<{
	title?: ReactNode;
	controls?: ReactNode;
}>;

export const ProfilesForm = ({ title, controls, children }: ProfilesFormProps) => {
	return (
		<VStack alignItems="start" gap="1.5rem">
			<VStack alignItems="start" w="100%" gap="1rem">
				{title && (
					<Text as="h3" color="#4e4e4e" fontSize="20px">
						{title}
					</Text>
				)}

				{children}
			</VStack>

			{controls && <VStack w="100%">{controls}</VStack>}
		</VStack>
	);
};
