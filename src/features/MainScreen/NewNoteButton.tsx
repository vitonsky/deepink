import React from 'react';
import { FaPenToSquare } from 'react-icons/fa6';
import { useDebouncedCallback } from 'use-debounce';
import { Button, HStack, Text } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const NewNoteButton = () => {
	const telemetry = useTelemetryTracker();

	const createNote = useCreateNote();
	const debouncedCreateNote = useDebouncedCallback(async () => {
		await createNote();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CREATED, {
			context: 'button "new note"',
		});
	}, 30);

	return (
		<Button variant="primary" w="100%" flexShrink={0} onClick={debouncedCreateNote}>
			<HStack gap="1rem">
				<FaPenToSquare />
				<Text>New note</Text>
			</HStack>
		</Button>
	);
};
