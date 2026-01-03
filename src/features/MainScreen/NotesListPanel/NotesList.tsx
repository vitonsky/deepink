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

	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = notes.findIndex((note) => note.id === activeNoteId);
		if (noteIndex === -1) virtualizer.scrollToIndex(0);

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });
	}, [activeNoteId, notes, notesView, virtualizer]);

	// Saves the offset when switching views so we can scroll to a note with an index greater than the base page size
	const notesOffset = useWorkspaceSelector(selectNotesOffset);
	const viewStateRef = useRef<{
		previousView: string;
		previousOffset: number;
		offsetsByView: Record<string, number>;
	}>({
		previousView: notesView,
		previousOffset: notesOffset,
		offsetsByView: {},
	});
	useEffect(() => {
		const state = viewStateRef.current;

		// Save offset of previous view
		if (state.previousView !== notesView) {
			state.offsetsByView[state.previousView] = state.previousOffset;

			// Restore offset for new view if needed
			if (state.offsetsByView[notesView] > notesOffset) {
				dispatch(
					workspacesApi.updateNotesOffset({
						...workspaceData,
						offset: state.offsetsByView[notesView] - notesOffset,
					}),
				);
			}
		}

		// Always track latest offset and view
		state.previousView = notesView;
		state.previousOffset = notesOffset;
	}, [notesView, notesOffset, dispatch, workspaceData]);

	// Show the spinner for a minimum amount of time
	const [isShowSpinner, setIsShowSpinner] = useState<boolean>(false);
	const isNotesLoading = useWorkspaceSelector(selectIsNotesLoading);
	useEffect(() => {
		if (isNotesLoading) {
			setIsShowSpinner(true);
		} else {
			new Promise((resolve) => setTimeout(resolve, 400)).then(() =>
				setIsShowSpinner(false),
			);
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
					{isShowSpinner && (
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
