import React from 'react';
import { FaPenToSquare } from 'react-icons/fa6';
import { useDebouncedCallback } from 'use-debounce';
import { Button, HStack, Text } from '@chakra-ui/react';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const NewNoteButton = () => {
	const createNote = useDebouncedCallback(useCreateNote(), 30);

	return (
		<Button variant="primary" w="100%" flexShrink={0} onClick={createNote}>
			<HStack gap="1rem">
				<FaPenToSquare />
				<Text>New note</Text>
			</HStack>
		</Button>
	);
};
