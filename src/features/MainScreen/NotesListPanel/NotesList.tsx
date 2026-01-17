import React, { FC, useEffect, useRef } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useNoteContextMenu } from '@features/NotesContainer/NoteContextMenu/useNoteContextMenu';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectNotes,
	selectSearch,
} from '@state/redux/profiles/profiles';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isElementInViewport } from '@utils/dom/isElementInViewport';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const telemetry = useTelemetryTracker();

	const noteActions = useNoteActions();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);

	const search = useWorkspaceSelector(selectSearch);

	const updateNotes = useUpdateNotes();
	const openNoteContextMenu = useNoteContextMenu({
		closeNote: noteActions.close,
		updateNotes,
	});

	const parentRef = useRef<HTMLDivElement>(null);
	const isActiveWorkspace = useIsActiveWorkspace();
	const virtualizer = useVirtualizer({
		enabled: isActiveWorkspace,
		count: notes.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 90,
		overscan: 30,
	});

	const items = virtualizer.getVirtualItems();

	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = notes.findIndex((note) => note === activeNoteId);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });

		// We only need scroll to active note once by its change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeNoteId, notes]);

	// TODO: implement dragging and moving items
	return (
		<VStack
			ref={parentRef}
			sx={{
				w: '100%',
				h: '100%',
				overflow: 'auto',
				align: 'center',
				userSelect: 'none',
			}}
		>
			{notes.length === 0 ? (
				<Text pos="relative" top="40%">
					Nothing added yet
				</Text>
			) : (
				<Box
					sx={{
						display: 'block',
						position: 'relative',
						width: '100%',
						height: virtualizer.getTotalSize(),
						flexShrink: 0,
					}}
				>
					<VStack
						sx={{
							position: 'absolute',
							width: '100%',
							top: 0,
							left: 0,
							transform: `translateY(${items[0]?.start ?? 0}px)`,
							gap: '4px',
						}}
					>
						{items.map((virtualRow) => {
							const noteId = notes[virtualRow.index];

							const isActive = noteId === activeNoteId;

							// TODO: get preview text from DB as prepared value
							// TODO: show attachments
							return (
								<NotePreview
									key={noteId}
									ref={(node) => {
										if (isActive) {
											activeNoteRef.current = node;
										}
										// virtualizer.measureElement(node);
									}}
									noteId={noteId}
									data-index={virtualRow.index}
									isSelected={isActive}
									textToHighlight={search}
									onContextMenu={(evt) => {
										openNoteContextMenu(
											note,
											getContextMenuCoords(evt.nativeEvent),
										);
									}}
									onClick={() => {
										noteActions.click(noteId);
										telemetry.track(
											TELEMETRY_EVENT_NAME.NOTE_OPENED,
											{
												context: 'notes list',
											},
										);
									}}
								/>
							);
						})}
					</VStack>
				</Box>
			)}
		</VStack>
	);
};
