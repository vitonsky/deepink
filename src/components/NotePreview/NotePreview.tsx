import React, { forwardRef, memo, useEffect, useState } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import {
	Box,
	Skeleton,
	StackProps,
	Text,
	useMultiStyleConfig,
	VStack,
} from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';

import { TextSample } from './TextSample';

export const NotePreview = memo(
	forwardRef<
		HTMLDivElement,
		{
			isSelected?: boolean;
			textToHighlight?: string;
			noteId: NoteId;
			isScrolling?: boolean;
		} & StackProps
	>(({ textToHighlight, noteId, isSelected, ...props }, ref) => {
		const styles = useMultiStyleConfig('NotePreview');

		const noteRegister = useNotesRegistry();
		const eventBus = useEventBus();

		const [note, setNote] = useState<INote>();
		useEffect(() => {
			noteRegister.getById(noteId).then((note) => {
				if (!note) return;
				setNote(note);
			});
		}, [noteId, noteRegister]);

		// Update preview when note content changes
		useEffect(() => {
			const update = (updatedNoteId: NoteId) => {
				if (updatedNoteId !== noteId) return;

				noteRegister.getById(noteId).then((note) => {
					if (!note) return;
					setNote(note);
				});
			};

			const cleanupUpdated = eventBus.listen(WorkspaceEvents.NOTE_UPDATED, update);
			const cleanupEdited = eventBus.listen(WorkspaceEvents.NOTE_EDITED, update);

			return () => {
				cleanupUpdated();
				cleanupEdited();
			};
		}, [noteId, eventBus, noteRegister]);

		if (!note)
			return (
				<Skeleton
					startColor="primary.100"
					endColor="dim.400"
					height="70px"
					w="100%"
				/>
			);

		const date = note.createdTimestamp ?? note.updatedTimestamp;
		return (
			<VStack
				ref={ref}
				aria-selected={isSelected}
				{...props}
				sx={{
					...styles.root,
					...props.sx,
				}}
			>
				<VStack sx={styles.body}>
					<Text as="h3" sx={styles.title}>
						<TextSample
							text={getNoteTitle(note.content)}
							highlightText={textToHighlight}
							lengthLimit={30}
						/>
					</Text>

					{note.content.text.length > 0 ? (
						<Text sx={styles.text}>
							<TextSample
								text={note.content.text}
								highlightText={textToHighlight}
								lengthLimit={150}
							/>
						</Text>
					) : undefined}
				</VStack>
				{date && (
					<Box sx={styles.meta}>
						{<Text>{new Date(date).toDateString()}</Text>}
					</Box>
				)}
			</VStack>
		);
	}),
);

NotePreview.displayName = 'NotePreview';
