import React, { FC, useLayoutEffect, useRef } from 'react';
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
		overscan: 40,
	});

	const items = virtualizer.getVirtualItems();

	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	useLayoutEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = notes.findIndex((note) => note === activeNoteId);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });

		// Because list items have dynamic heights, scrollToIndex may not always position the item correctly
		// For fix it we wait for the DOM element to render and then scroll to it manually
		let cancelled = false;
		const waitForRender = () => {
			if (cancelled) return;

			const item = virtualizer.getVirtualItems().find((i) => i.index === noteIndex);
			if (item) {
				const activeNode =
					activeNoteRef.current ??
					parentRef.current?.querySelector<HTMLElement>(
						`[data-index="${noteIndex}"]`,
					);

				if (activeNode) {
					activeNode.scrollIntoView({ block: 'center', behavior: 'auto' });
				} else {
					virtualizer.scrollToOffset(item.start);
				}
			} else {
				requestAnimationFrame(waitForRender);
			}
		};

		const requestAnimationId = requestAnimationFrame(waitForRender);
		return () => {
			cancelled = true;
			cancelAnimationFrame(requestAnimationId);
		};
	}, [activeNoteId, notes, virtualizer]);

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
										virtualizer.measureElement(node);
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
