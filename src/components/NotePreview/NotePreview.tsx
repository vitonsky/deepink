import React, { forwardRef, useEffect, useState } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, StackProps, Text, useMultiStyleConfig, VStack } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';

import { TextSample } from './TextSample';

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		isSelected?: boolean;
		textToHighlight?: string;
		noteId: NoteId;
	} & StackProps
>(({ textToHighlight, noteId, isSelected, ...props }, ref) => {
	const telemetry = useTelemetryTracker();
	const noteActions = useNoteActions();

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

	useEffect(() => {
		const onUpdate = (updatedNoteId: NoteId) => {
			if (updatedNoteId === noteId) {
				noteRegister.getById(noteId).then((note) => {
					if (!note) return;
					setNote(note);
				});
			}
		};

		const cleanupUpdated = eventBus.listen(WorkspaceEvents.NOTE_UPDATED, onUpdate);
		const cleanupEdited = eventBus.listen(WorkspaceEvents.NOTE_EDITED, onUpdate);

		return () => {
			cleanupUpdated();
			cleanupEdited();
		};
	}, [noteId, eventBus, noteRegister]);

	if (!note) return null;

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
			onClick={() => {
				noteActions.openNote(note);
				telemetry.track(TELEMETRY_EVENT_NAME.NOTE_OPENED, {
					context: 'notes list',
				});
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
				<Box sx={styles.meta}>{<Text>{new Date(date).toDateString()}</Text>}</Box>
			)}
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
