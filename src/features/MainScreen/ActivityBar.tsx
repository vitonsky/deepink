import React from 'react';
import { FaInbox, FaPenToSquare, FaRegClock, FaRegFolder } from 'react-icons/fa6';
import { GrSettingsOption } from 'react-icons/gr';
import { IoCloudUploadOutline, IoExtensionPuzzleOutline } from 'react-icons/io5';
import { MdLockOutline } from 'react-icons/md';
import { useDebouncedCallback } from 'use-debounce';
import { ButtonGroup, IconButton, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const ActivityBar = () => {
	const telemetry = useTelemetryTracker();

	const createNote = useCreateNote();
	const debouncedCreateNote = useDebouncedCallback(async () => {
		await createNote();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CREATED, {
			context: 'button "new note"',
		});
	}, 30);

	return (
		<VStack
			sx={{
				alignItems: 'start',
				minHeight: '100%',
				padding: '.5rem',
				overflow: 'hidden',

				'& button': {
					padding: 0,
					'& svg': {
						boxSize: '50%',
					},
				},
			}}
		>
			<ButtonGroup orientation="vertical" size="sm" variant="ghost">
				<IconButton
					icon={<FaPenToSquare />}
					aria-label="New note"
					variant="primary"
					onClick={debouncedCreateNote}
				/>

				<IconButton
					icon={<FaRegFolder />}
					aria-label="New note"
					data-no-animation
				/>

				<IconButton
					icon={<FaRegClock />}
					aria-label="New note"
					data-no-animation
				/>
				<IconButton
					icon={<IoExtensionPuzzleOutline style={{ scale: 1.3 }} />}
					aria-label="New note"
					data-no-animation
				/>

				<IconButton icon={<FaInbox />} aria-label="New note" data-no-animation />

				<IconButton
					icon={<IoCloudUploadOutline />}
					aria-label="New note"
					data-no-animation
				/>
			</ButtonGroup>

			<ButtonGroup
				marginTop="auto"
				orientation="vertical"
				size="sm"
				variant="ghost"
			>
				<IconButton
					icon={<MdLockOutline style={{ scale: 1.3 }} />}
					aria-label="New note"
					data-no-animation
				/>
				<IconButton
					icon={<GrSettingsOption style={{ scale: 1.2 }} />}
					aria-label="New note"
					data-no-animation
				/>
			</ButtonGroup>
		</VStack>
	);
};
