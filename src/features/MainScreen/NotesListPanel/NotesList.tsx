import React, { FC, useEffect, useRef, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { getNoteTitle } from '@core/features/notes/utils';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	NOTES_PAGE_SIZE,
	selectActiveNoteId,
	selectIsNotesLoading,
	selectNotes,
	selectNotesOffset,
	selectSearch,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isElementInViewport } from '@utils/dom/isElementInViewport';

import { useNoteContextMenu } from '../../NotesContainer/NoteContextMenu/useNoteContextMenu';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const telemetry = useTelemetryTracker();

	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

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
		overscan: 5,
	});

	const items = virtualizer.getVirtualItems();

	// Loads more notes when reaching the bottom of the notes list
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const isLoadMoreNotesRef = useRef(0);
	useEffect(() => {
		if (!notes.length) return;

		const lazyLoadingThreshold = Math.ceil(NOTES_PAGE_SIZE * 0.2);
		const lastVisibleIndex = items[items.length - 1].index;

		if (
			lastVisibleIndex >= notes.length - lazyLoadingThreshold &&
			isLoadMoreNotesRef.current !== notes.length
		) {
			isLoadMoreNotesRef.current = notes.length;
			dispatch(
				workspacesApi.updateNotesOffset({
					...workspaceData,
					offset: 100,
				}),
			);
		}
	}, [items, notes, dispatch, workspaceData]);

	const notesView = useWorkspaceSelector(selectNotesView);
	useEffect(() => {
		// Reset lazy load flag when switching views to allow loading notes
		isLoadMoreNotesRef.current = 0;
	}, [notesView]);

	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	const scrollTargetIdRef = useRef<string | null>(null);
	const scrollToActiveNotes = () => {
		if (!scrollTargetIdRef.current) return;

		// Skip if active note is in viewport
		if (
			activeNoteRef.current !== null &&
			isElementInViewport(activeNoteRef.current)
		) {
			scrollTargetIdRef.current = null;
			return;
		}

		const noteIndex = notes.findIndex(
			(note) => note.id === scrollTargetIdRef.current,
		);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });
		scrollTargetIdRef.current = null;
	};

	// Scroll to active note
	useEffect(() => {
		if (activeNoteId) {
			scrollTargetIdRef.current = activeNoteId;
			scrollToActiveNotes();
			return;
		}
		scrollTargetIdRef.current = null;
	}, [activeNoteId, notesView]);

	// Update scroll when notes are updated
	useEffect(() => {
		if (!scrollTargetIdRef.current) return;
		scrollToActiveNotes();
	}, [notes]);

	// Saves the offset when switching views so we can scroll to a note with an index greater than the base page size
	const notesOffset = useWorkspaceSelector(selectNotesOffset);
	const offsetsByViewRef = useRef<Record<string, number>>({
		[notesView]: notesOffset,
	});
	useEffect(() => {
		const previousOffset = offsetsByViewRef.current[notesView] ?? 0;
		if (notesOffset < previousOffset) {
			dispatch(
				workspacesApi.updateNotesOffset({
					...workspaceData,
					offset: previousOffset - notesOffset,
				}),
			);
		}

		offsetsByViewRef.current[notesView] = notesOffset;
	}, [notesView, notesOffset, dispatch, workspaceData]);

	// Show the spinner for a minimum amount of time
	const isNotesLoading = useWorkspaceSelector(selectIsNotesLoading);
	const [isShowSpinner, setIsShowSpinner] = useState<boolean>(false);
	useEffect(() => {
		if (isNotesLoading) {
			setIsShowSpinner(true);
		} else {
			setTimeout(() => setIsShowSpinner(false), 400);
		}
	}, [isNotesLoading]);

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
				<>
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

								const date =
									note.createdTimestamp ?? note.updatedTimestamp;
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
										textToHighlight={search}
										title={getNoteTitle(note.content)}
										text={note.content.text}
										meta={
											date && (
												<Text>
													{new Date(date).toDateString()}
												</Text>
											)
										}
										onContextMenu={(evt) => {
											openNoteContextMenu(note, {
												x: evt.pageX,
												y: evt.pageY,
											});
										}}
										onClick={() => {
											noteActions.click(note.id);
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
					{isShowSpinner && notes.length > 0 && (
						<Box
							position="sticky"
							display="flex"
							justifyContent="end"
							w="90%"
							bottom="16px"
						>
							<Spinner />
						</Box>
					)}
				</>
			)}
		</VStack>
	);
};
