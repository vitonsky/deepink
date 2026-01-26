import React from 'react';
import { FaFeather, FaInbox, FaRegClock, FaRegFolder } from 'react-icons/fa6';
import { GrSettingsOption } from 'react-icons/gr';
import { IoCloudUploadOutline, IoExtensionPuzzleOutline } from 'react-icons/io5';
import { MdLockOutline } from 'react-icons/md';
import { useDebouncedCallback } from 'use-debounce';
import { ButtonGroup, VStack } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { PROFILE_SCREEN } from '@features/App';
import { useProfileControls } from '@features/App/Profile';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const ActivityBar = () => {
	const telemetry = useTelemetryTracker();

	const profileControls = useProfileControls();

	const command = useCommand();

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
					icon={<FaFeather />}
					tooltipPlacement="right"
					title="New note"
					variant="accent"
					onClick={debouncedCreateNote}
				/>

				<IconButton
					icon={<FaRegFolder />}
					tooltipPlacement="right"
					title="Files"
					data-no-animation
				/>

				<IconButton
					icon={<FaRegClock />}
					tooltipPlacement="right"
					title="Reminders"
					data-no-animation
				/>
				<IconButton
					icon={<IoExtensionPuzzleOutline style={{ scale: 1.3 }} />}
					tooltipPlacement="right"
					title="Extensions"
					data-no-animation
				/>

				<IconButton
					icon={<FaInbox />}
					tooltipPlacement="right"
					title="Inbox"
					data-no-animation
				/>

				<IconButton
					icon={<IoCloudUploadOutline />}
					tooltipPlacement="right"
					title="Publish notes"
					data-no-animation
				/>
			</ButtonGroup>

			<ButtonGroup
				marginTop="auto"
				orientation="vertical"
				size="sm"
				variant="ghost"
			>
				{profileControls.profile.profile.isEncrypted && (
					// Only encrypted profiles can be locked
					<IconButton
						icon={<MdLockOutline style={{ scale: 1.3 }} />}
						title="Lock profile"
						tooltipPlacement="right"
						data-no-animation
						onClick={() => {
							command(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE);
							command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
								screen: PROFILE_SCREEN.LOGIN,
							});
						}}
					/>
				)}
				<IconButton
					icon={<GrSettingsOption style={{ scale: 1.2 }} />}
					title="Global settings"
					tooltipPlacement="right"
					data-no-animation
					onClick={() => {
						command(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS);

						telemetry.track(TELEMETRY_EVENT_NAME.SETTINGS_CLICK, {
							scope: 'global settings',
						});
					}}
				/>
			</ButtonGroup>
		</VStack>
	);
};
