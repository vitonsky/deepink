import React, { FC } from 'react';
import {
	FaBookmark,
	FaBookOpen,
	FaBoxArchive,
	FaFile,
	FaInbox,
	FaTrash,
} from 'react-icons/fa6';
import { HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { NOTES_VIEW, workspacesApi } from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesViewMode = useWorkspaceSelector(selectNotesView);

	return (
		<NestedList
			overflow="auto"
			w="100%"
			minHeight="8rem"
			flexShrink={999_999}
			items={[
				{
					id: 'inbox',
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaInbox />
							<Text>Inbox</Text>
						</HStack>
					),
				},
				{
					id: NOTES_VIEW.All_NOTES,
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaBookOpen />
							<Text>All notes</Text>
						</HStack>
					),
				},
				{
					id: NOTES_VIEW.BOOKMARK,
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaBookmark />
							<Text>Bookmarks</Text>
						</HStack>
					),
				},
				{
					id: NOTES_VIEW.ARCHIVE,
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaBoxArchive />
							<Text>Archive</Text>
						</HStack>
					),
				},
				{
					id: 'files',
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaFile />
							<Text>Files</Text>
						</HStack>
					),
				},
				{
					id: NOTES_VIEW.BIN,
					content: (
						<HStack padding="0.5rem 1rem" gap="0.8rem">
							<FaTrash />
							<Text>Bin</Text>
						</HStack>
					),
				},
			]}
			activeItem={notesViewMode}
			onPick={(id) => {
				if (!Object.values(NOTES_VIEW).includes(id as NOTES_VIEW)) return;

				dispatch(
					workspacesApi.setView({
						...workspaceData,
						view: id as NOTES_VIEW,
					}),
				);

				dispatch(
					workspacesApi.setSelectedTag({
						...workspaceData,
						tag: null,
					}),
				);
			}}
		/>
	);
};
