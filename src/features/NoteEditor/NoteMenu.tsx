import React, { memo } from 'react';
import {
	FaBell,
	FaBoxArchive,
	FaClock,
	FaCopy,
	FaDownload,
	FaEllipsis,
	FaEye,
	FaFileExport,
	FaLink,
	FaRotate,
	FaShield,
	FaSpellCheck,
	FaTrashCan,
} from 'react-icons/fa6';
import {
	Button,
	HStack,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
} from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';

export const NoteMenu = memo(({ note }: { note: INote }) => {
	const runCommand = useCommand();

	return (
		<Menu>
			<MenuButton as={Button} variant="ghost" size="sm">
				<FaEllipsis />
			</MenuButton>
			<MenuList>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaCopy />
						<Text>Copy reference on note</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaBell />
						<Text>Remind me</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaClock />
						<Text>History</Text>
						{note.isSnapshotsDisabled && (
							<Text color="typography.secondary">(Disabled)</Text>
						)}
					</HStack>
				</MenuItem>
				<MenuItem onClick={() => console.log('TODO: show note backlinks')}>
					<HStack>
						<FaLink />
						<Text>Back links</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaEye />
						<Text>Readonly mode</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaDownload />
						<Text>Download and convert a network media</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaSpellCheck />
						<Text>Spellcheck</Text>
					</HStack>
				</MenuItem>

				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, { noteId: note.id })
					}
				>
					<HStack>
						<FaFileExport />
						<Text>Export...</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaShield />
						<Text>Password protection...</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaRotate />
						<Text>Disable sync</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaBoxArchive />
						<Text>
							{note.isArchived ? 'Remove from archive' : 'Move to archive'}
						</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() =>
						note.isDeleted
							? runCommand(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, {
									noteId: note.id,
								})
							: runCommand(GLOBAL_COMMANDS.DELETE_NOTE, {
									noteId: note.id,
									permanently: false,
								})
					}
				>
					<HStack>
						<FaTrashCan />
						<Text>
							{note.isDeleted ? 'Restore from Bin' : 'Delete to Bin'}
						</Text>
					</HStack>
				</MenuItem>
			</MenuList>
		</Menu>
	);
});
