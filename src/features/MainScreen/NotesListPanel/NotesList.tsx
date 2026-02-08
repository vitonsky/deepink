import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
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
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';
import { isElementInViewport } from '@utils/dom/isElementInViewport';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const noteRegister = useNotesRegistry();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);

	const search = useWorkspaceSelector(selectSearch);

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
		overscan: 10,
	});

	// Scroll to active note
	// Preliminary scroll to render the active note in the DOM; may be inaccurate, corrected afterwards
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	const correctiveScrollIndexRef = useRef<number | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = notes.findIndex((id) => id === activeNoteId);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });

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

	// Corrective scroll to the active note if needed
	const correctActiveNoteScroll = useCallback(
		(virtualIndex: number) => (node: HTMLDivElement | null) => {
			if (!node || !parentRef.current) return;
			const parentRect = parentRef.current.getBoundingClientRect();
			const activeNoteRect = node.getBoundingClientRect();

			// Corrective scroll to active node
			if (correctiveScrollIndexRef.current === virtualIndex) {
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
		},
		[],
	);

	const virtualNotes = virtualizer.getVirtualItems();
	const [notesInViewport, setNotesInViewport] = useState<Map<string, INote>>(new Map());
	const loadViewportNotes = useDebouncedCallback(
		(noteIds: NoteId[]) => {
			noteRegister.getByIds(noteIds).then((loadedNotes) => {
				if (!loadedNotes || !loadedNotes.length) return;

				const newNotes = new Map<NoteId, INote>();
				for (const note of loadedNotes) {
					newNotes.set(note.id, note);
				}
				setNotesInViewport(newNotes);
			});
		},
		{ wait: 10 },
	);

	useEffect(() => {
		const noteIds = virtualNotes.map((i) => notes[i.index]);
		if (noteIds.length === 0) return;

		loadViewportNotes(noteIds);
	}, [notes, noteRegister, virtualNotes, loadViewportNotes]);

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
							width: '100%',
							top: 0,
							left: 0,
							marginTop: `${virtualNotes[0]?.start ?? 0}px`,
							gap: '4px',
						}}
					>
						{virtualNotes.map((virtualRow) => {
							const noteId = notes[virtualRow.index];
							const note = notesInViewport.get(noteId);

							if (!note)
								return (
									<Skeleton
										key={noteId}
										ref={virtualizer.measureElement}
										data-index={virtualRow.index}
										startColor="primary.100"
										endColor="dim.400"
										height="70px"
										w="100%"
									/>
								);

							const date = note.createdTimestamp ?? note.updatedTimestamp;
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

										correctActiveNoteScroll(virtualRow.index);
									}}
									data-index={virtualRow.index}
									isSelected={isActive}
									textToHighlight={search}
									title={getNoteTitle(note.content)}
									text={note?.content.text}
									meta={
										date && (
											<Text>{new Date(date).toDateString()}</Text>
										)
									}
									onContextMenu={(evt) => {
										openNoteContextMenu(
											noteId,
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
