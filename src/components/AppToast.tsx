import React, { ReactNode } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';

export const AppToast = ({
	title,
	body,
	actions,
}: {
	title?: ReactNode;
	body?: ReactNode;
	actions?: ReactNode;
}) => {
	return (
		<VStack
			padding="1rem 1.5rem"
			gap="1rem"
			align="start"
			backgroundColor="surface.panel"
			border="1px solid"
			borderColor="surface.border"
			borderRadius="4px"
		>
			<Box>
				{title && (
					<Text fontSize="1.2rem" fontWeight="bold">
						{title}
					</Text>
				)}
				{body && <Text>{body}</Text>}
			</Box>

			{actions && <HStack>{actions}</HStack>}
		</VStack>
	);
};
