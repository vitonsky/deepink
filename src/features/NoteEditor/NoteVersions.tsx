import React, { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaGlasses, FaTrashCan, FaXmark } from 'react-icons/fa6';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { useEventBus, useNotesHistory } from '@features/App/Workspace/WorkspaceProvider';

export const NoteVersions = ({
	noteId,
	onClose,
	onVersionApply,
	onShowVersion,
}: {
	noteId: string;
	onClose: () => void;
	onVersionApply?: (version: NoteVersion) => void;
	onShowVersion?: (version: NoteVersion) => void;
}) => {
	const noteHistory = useNotesHistory();

	const [versions, setVersions] = useState<NoteVersion[] | null>(null);
	const updateVersionsList = useCallback(
		() => noteHistory.getList(noteId).then(setVersions),
		[noteHistory, noteId],
	);

	useEffect(() => {
		setVersions(null);
		updateVersionsList();
	}, [noteId, updateVersionsList]);

	// Refresh note versions by event
	const eventBus = useEventBus();
	useEffect(() => {
		return eventBus.listen('noteHistoryUpdated', (noteId) => {
			if (noteId !== noteId) return;
			updateVersionsList();
		});
	}, [eventBus, updateVersionsList]);

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
									<Button
										size="sm"
										title="Open version"
										onClick={() => onShowVersion?.(version)}
									>
										<FaGlasses />
									</Button>
									<Button
										size="sm"
										title="Delete version"
										onClick={() => {
											noteHistory.delete([version.id]);
											eventBus.emit('noteHistoryUpdated', noteId);
										}}
									>
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
