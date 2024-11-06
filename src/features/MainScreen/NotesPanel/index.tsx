import React from 'react';
import { FaArrowDownWideShort, FaMagnifyingGlass } from 'react-icons/fa6';
import {
	Button,
	HStack,
	Input,
	InputGroup,
	InputLeftElement,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import { NotesList } from '@features/MainScreen/NotesList';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveTag } from '@state/redux/profiles/profiles';

export const NotesPanel = () => {
	const activeTag = useWorkspaceSelector(selectActiveTag);

	return (
		<VStack
			align="start"
			sx={{
				width: '100%',
				height: '100%',
				flexDirection: 'column',
				gap: '1rem',
			}}
		>
			<VStack align="start" w="100%" gap="0.8rem">
				<HStack>
					<InputGroup size="sm">
						<InputLeftElement pointerEvents="none">
							<FaMagnifyingGlass />
						</InputLeftElement>
						<Input borderRadius="6px" placeholder="Search..." />
					</InputGroup>

					<Button variant="primary" size="sm" paddingInline=".5rem">
						<FaArrowDownWideShort />
					</Button>
				</HStack>

				{activeTag && (
					<HStack maxW="100%" paddingInline=".3rem">
						<Text minW="fit-content">With tag</Text>
						<Tag variant="accent">
							<Text
								maxW="100%"
								whiteSpace="nowrap"
								overflow="hidden"
								textOverflow="ellipsis"
								dir="rtl"
							>
								{activeTag.resolvedName}
							</Text>
						</Tag>
					</HStack>
				)}
			</VStack>

			<NotesList />
		</VStack>
	);
};
