import React, { FC, useEffect, useRef } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useNoteContextMenu } from '@features/NotesContainer/NoteContextMenu/useNoteContextMenu';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectNotes,
	selectSearch,
} from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isElementInViewport } from '@utils/dom/isElementInViewport';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);

	const search = useWorkspaceSelector(selectSearch);

	const noteActions = useNoteActions();
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
		estimateSize: () => 70,
		overscan: 30,
	});

	const items = virtualizer.getVirtualItems();

	// Scroll to active note
	// Preliminary scroll to render the active note in the DOM; may be inaccurate, corrected afterwards
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	const correctiveScrollIndexRef = useRef<number | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (
			activeNoteRef.current !== null &&
			isElementInViewport(activeNoteRef.current)
		) {
			return;
		}

		const noteIndex = notes.findIndex((id) => id === activeNoteId);
		if (noteIndex === -1) {
			console.log('not scroll');
			return;
		}

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });
		console.log('scroll');

		correctiveScrollIndexRef.current = noteIndex;
	}, [activeNoteId, notes, virtualizer]);

	// Reset scroll bar after view change
	const notesView = useWorkspaceSelector(selectNotesView);
	useEffect(() => {
		if (!activeNoteId) {
			virtualizer.scrollToOffset(0);
			return;
		}

		const noteIndex = notes.findIndex((id) => id === activeNoteId);
		if (noteIndex === -1) {
			virtualizer.scrollToOffset(0);
		}
	}, [notesView, notes, activeNoteId, virtualizer]);

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
										virtualizer.measureElement(node);

										if (!isActive) return;
										activeNoteRef.current = node;

										if (!node || !parentRef.current) return;
										const parentRect =
											parentRef.current.getBoundingClientRect();
										const activeNoteRect =
											node.getBoundingClientRect();

										// Corrective scroll to active node
										if (
											correctiveScrollIndexRef.current ===
											virtualRow.index
										) {
											correctiveScrollIndexRef.current = null;

											const offset =
												parentRef.current.scrollTop +
												(activeNoteRect.top - parentRect.top) -
												parentRef.current.clientHeight / 2 +
												activeNoteRect.height / 2;

											parentRef.current.scrollTo({
												top: offset,
											});
										}
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
								/>
							);
						})}
					</VStack>
				</Box>
			)}
		</VStack>
	);
};
