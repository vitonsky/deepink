import React, { FC, useEffect, useRef, useState } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, Skeleton, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useNoteContextMenu } from '@features/NotesContainer/NoteContextMenu/useNoteContextMenu';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectNoteIds,
	selectSearch,
} from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';
import { isElementInViewport } from '@utils/dom/isElementInViewport';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const telemetry = useTelemetryTracker();

	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegister = useNotesRegistry();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const noteIds = useWorkspaceSelector(selectNoteIds);

	const search = useWorkspaceSelector(selectSearch);

	const openNoteContextMenu = useNoteContextMenu({
		closeNote: noteActions.close,
		updateNotes,
	});

	const parentRef = useRef<HTMLDivElement>(null);
	const isActiveWorkspace = useIsActiveWorkspace();

	// FIXME: https://github.com/TanStack/virtual/issues/1119
	// eslint-disable-next-line react-hooks/incompatible-library
	const virtualizer = useVirtualizer({
		enabled: isActiveWorkspace,
		count: noteIds.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 70,
		overscan: 7,
		useFlushSync: false,
	});

	const virtualNoteItems = virtualizer.getVirtualItems();

	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);

	// Save index to made a corrective scroll after the NotePreview is rendered and measured
	// because sometimes after scrolling the preview remains outside the viewport
	const scrollCorrectionIndexRef = useRef<number | null>(null);
	useEffect(() => {
		if (!activeNoteId) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current))
			return;

		const noteIndex = noteIds.findIndex((noteId) => noteId === activeNoteId);
		if (noteIndex === -1) return;

		virtualizer.scrollToIndex(noteIndex, { align: 'start' });

		scrollCorrectionIndexRef.current = noteIndex;
	}, [activeNoteId, noteIds, virtualizer]);

	// Reset the scroll bar after a view change
	const notesView = useWorkspaceSelector(selectNotesView);
	useEffect(() => {
		virtualizer.scrollToOffset(0);
	}, [notesView, virtualizer]);

	// Load notes
	const [notesInViewport, setNotesInViewport] = useState<Record<NoteId, INote>>({});
	const loadViewportNotes = useDebouncedCallback(
		(noteIds: NoteId[]) => {
			notesRegister.getById(noteIds).then((loadedNotes) => {
				if (loadedNotes.length === 0) return;

				setNotesInViewport(
					Object.fromEntries(loadedNotes.map((note) => [note.id, note])),
				);
			});
		},
		{ wait: 10 },
	);
	useEffect(() => {
		const ids = virtualNoteItems.map((i) => noteIds[i.index]);
		if (ids.length === 0) return;

		loadViewportNotes(ids);
	}, [noteIds, virtualNoteItems, loadViewportNotes]);

	// Update preview when note content changes
	const eventBus = useEventBus();
	useEffect(() => {
		const update = (updatedNoteId: NoteId) => {
			if (!notesInViewport[updatedNoteId]) return;

			const ids = virtualNoteItems.map((i) => noteIds[i.index]);
			if (ids.length === 0) return;

			loadViewportNotes(noteIds);
		};

		const cleanupUpdated = eventBus.listen(WorkspaceEvents.NOTE_UPDATED, update);
		const cleanupEdited = eventBus.listen(WorkspaceEvents.NOTE_EDITED, update);

		return () => {
			cleanupUpdated();
			cleanupEdited();
		};
	}, [
		eventBus,
		notesRegister,
		notesInViewport,
		loadViewportNotes,
		virtualNoteItems,
		noteIds,
	]);

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
			{noteIds.length === 0 ? (
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
							marginTop: `${virtualNoteItems[0]?.start ?? 0}px`,
							gap: '4px',
						}}
					>
						{virtualNoteItems.map((virtualRow) => {
							const id = noteIds[virtualRow.index];
							const note = notesInViewport[id];

							if (!note)
								return (
									<Skeleton
										key={id}
										ref={virtualizer.measureElement}
										data-index={virtualRow.index}
										startColor="primary.100"
										endColor="dim.400"
										height="70px"
										w="100%"
									/>
								);

							const date = note.createdTimestamp ?? note.updatedTimestamp;
							const isActive = note.id === activeNoteId;

							// TODO: get preview text from DB as prepared value
							// TODO: show attachments
							return (
								<NotePreview
									key={note.id}
									ref={(node) => {
										virtualizer.measureElement(node);

										if (!isActive) return;
										activeNoteRef.current = node;

										// Corrective scroll to the active note if needed
										if (
											scrollCorrectionIndexRef.current !==
											virtualRow.index
										)
											return;

										virtualizer.scrollToIndex(virtualRow.index, {
											align: 'start',
										});
										scrollCorrectionIndexRef.current = null;
									}}
									data-index={virtualRow.index}
									isSelected={isActive}
									textToHighlight={search}
									title={getNoteTitle(note.content)}
									text={note.content.text}
									meta={
										date && (
											<Text>{new Date(date).toDateString()}</Text>
										)
									}
									onContextMenu={(evt) => {
										openNoteContextMenu(
											note,
											getContextMenuCoords(evt.nativeEvent),
										);
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
			)}
		</VStack>
	);
};
