import React, { FC, useEffect, useRef } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { getNoteTitle } from '@core/features/notes/utils';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectNotes } from '@state/redux/profiles/profiles';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

function isElementInViewport(node: HTMLElement) {
	// eslint-disable-next-line spellcheck/spell-checker
	const rect = node.getBoundingClientRect();

	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	console.log('> Render NotesList');

	const notesRegistry = useNotesRegistry();
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);

	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: noteActions.close,
		notesRegistry,
		updateNotes,
	});

	const parentRef = useRef<HTMLDivElement>(null);
	const virtualizer = useVirtualizer({
		count: notes.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 70,
		overscan: 5,
	});

	const items = virtualizer.getVirtualItems();

	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = notes.findIndex((note) => note.id === activeNoteId);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });

		// We only need scroll to active note once by its change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeNoteId]);

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
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const note = notes[virtualRow.index];

							const date = note.createdTimestamp ?? note.updatedTimestamp;
							const text = note.content.text.slice(0, 80).trim();
							const isActive = note.id === activeNoteId;

							// TODO: get preview text from DB as prepared value
							// TODO: show attachments
							return (
								<NotePreview
									key={note.id}
									ref={(node) => {
										if (isActive) {
											activeNoteRef.current = node;
										}

										virtualizer.measureElement(node);
									}}
									data-index={virtualRow.index}
									isSelected={isActive}
									title={getNoteTitle(note.content)}
									text={text}
									meta={
										date && (
											<Text>{new Date(date).toDateString()}</Text>
										)
									}
									onContextMenu={(evt) => {
										openNoteContextMenu(note.id, {
											x: evt.pageX,
											y: evt.pageY,
										});
									}}
									onClick={() => {
										noteActions.click(note.id);
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
