import React from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';

export const BackLinksTree = ({ onClose }: { onClose: () => void }) => {
	return (
		<VStack
			align="start"
			w="100%"
			h="300px"
			flex={1}
			padding=".5rem"
			gap="1rem"
			borderTop="1px solid"
			borderColor="surface.border"
		>
			<HStack w="100%">
				<Text fontWeight="bold">Back links tree</Text>
				<Button variant="ghost" size="xs" marginLeft="auto" onClick={onClose}>
					<FaXmark />
				</Button>
			</HStack>

			<Box w="100%">TODO: Note related data here</Box>
		</VStack>
	);
};
