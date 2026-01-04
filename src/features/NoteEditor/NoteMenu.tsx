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

// TODO: call commands by click items
export const NoteMenu = memo(({ note }: { note: INote }) => {
	const runCommand = useCommand();

	return (
		<Menu>
			<MenuButton as={Button} variant="ghost" size="sm">
				<FaEllipsis />
			</MenuButton>
			<MenuList>
				<MenuItem>
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
				<MenuItem onClick={() => runCommand(GLOBAL_COMMANDS.OPEN_NOTE_HISTORY)}>
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

				<MenuItem>
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
				<MenuItem>
					<HStack>
						<FaBoxArchive />
						<Text>Archive</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaTrashCan />
						<Text>Delete</Text>
					</HStack>
				</MenuItem>
			</MenuList>
		</Menu>
	);
});
