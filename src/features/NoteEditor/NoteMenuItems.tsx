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

export enum NoteMenuItems {
	TOGGLE_BACKLINKS,
	TOGGLE_HISTORY,
}

export const NoteMenu = memo(
	({ onClick }: { onClick?: (command: NoteMenuItems) => void }) => {
		return (
			<Menu>
				<MenuButton as={Button} variant="primary" size="sm">
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
					<MenuItem onClick={() => onClick?.(NoteMenuItems.TOGGLE_HISTORY)}>
						<HStack>
							<FaClock />
							<Text>History</Text>
						</HStack>
					</MenuItem>
					<MenuItem onClick={() => onClick?.(NoteMenuItems.TOGGLE_BACKLINKS)}>
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
	},
);
