import React, { FC } from 'react';
import { FaBookmark, FaBoxArchive, FaCompass, FaTrash } from 'react-icons/fa6';
import { ButtonGroup, HStack } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { NOTES_VIEW, workspacesApi } from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';

export type NotesOverviewProps = {};

const FilterOptions = [
	{
		id: NOTES_VIEW.All_NOTES,
		icon: FaCompass,
		label: 'All notes',
	},
	{
		id: NOTES_VIEW.BOOKMARK,
		icon: FaBookmark,
		label: 'Bookmarked notes',
	},
	{
		id: NOTES_VIEW.ARCHIVE,
		icon: FaBoxArchive,
		label: 'Archived notes',
	},
	{
		id: NOTES_VIEW.BIN,
		icon: FaTrash,
		label: 'Deleted notes',
	},
];

export const NotesViewFilter: FC<NotesOverviewProps> = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesViewMode = useWorkspaceSelector(selectNotesView);
	return (
		<HStack w="100%" justifyContent="center">
			<ButtonGroup spacing=".3rem" size="sm" variant="ghost">
				{FilterOptions.map(({ id, label, ...option }) => (
					<IconButton
						key={id}
						icon={<option.icon />}
						title={label}
						data-no-animation
						isActive={id === notesViewMode}
						onClick={() => {
							dispatch(
								workspacesApi.setView({
									...workspaceData,
									view: id,
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
				))}
			</ButtonGroup>
		</HStack>
	);
};
