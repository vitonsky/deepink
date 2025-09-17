import React, { useEffect, useState } from 'react';
import { FaCheck, FaGlasses, FaTrashCan, FaXmark } from 'react-icons/fa6';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { useNotesHistory } from '@features/App/Workspace/WorkspaceProvider';

export const NoteVersions = ({
	noteId,
	onClose,
	onVersionApply,
}: {
	noteId: string;
	onClose: () => void;
	onVersionApply?: (version: NoteVersion) => void;
}) => {
	const noteHistory = useNotesHistory();

	const [versions, setVersions] = useState<NoteVersion[] | null>(null);
	useEffect(() => {
		setVersions(null);
		noteHistory.getList(noteId).then(setVersions);
	}, [noteHistory, noteId]);

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
				<Text fontWeight="bold">Note versions</Text>
				<Button variant="ghost" size="xs" marginLeft="auto" onClick={onClose}>
					<FaXmark />
				</Button>
			</HStack>

			<Box w="100%" maxH="150px" overflow="auto">
				{versions === null ? (
					<Text>Loading...</Text>
				) : (
					<VStack w="100%" gap={0}>
						{versions.map((version) => (
							<HStack
								key={version.id}
								w="100%"
								align="start"
								padding="0.3rem"
								alignItems="center"
								_hover={{ backgroundColor: 'dim.50' }}
							>
								<HStack>
									<Text>
										{new Date(version.createdAt).toLocaleString()}
									</Text>
									<Text color="typography.secondary">
										{version.text.length} chars
									</Text>
								</HStack>
								<HStack marginLeft="auto">
									<Button
										size="sm"
										title="Apply version"
										onClick={() => onVersionApply?.(version)}
									>
										<FaCheck />
									</Button>
									<Button size="sm" title="Open version">
										<FaGlasses />
									</Button>
									<Button size="sm" title="Delete version">
										<FaTrashCan />
									</Button>
								</HStack>
							</HStack>
						))}
					</VStack>
				)}
			</Box>
		</VStack>
	);
};
