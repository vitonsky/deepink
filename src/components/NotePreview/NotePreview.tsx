import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
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

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		isSelected?: boolean;
		textToHighlight?: string;
		noteId: NoteId;
	} & StackProps
>(({ textToHighlight, noteId, isSelected, ...props }, ref) => {
	const styles = useMultiStyleConfig('NotePreview');

	const noteRegister = useNotesRegistry();
	const eventBus = useEventBus();

	const [note, setNote] = useState<INote>();

	const loadNote = useCallback(async () => {
		const note = await noteRegister.getById(noteId);
		if (note) setNote(note);
	}, [noteId, noteRegister]);

	useEffect(() => {
		loadNote();
	}, [loadNote]);

	useEffect(() => {
		const onUpdate = (updatedNoteId: NoteId) => {
			if (updatedNoteId === noteId) loadNote();
		};

		const cleanupUpdated = eventBus.listen(WorkspaceEvents.NOTE_UPDATED, onUpdate);
		const cleanupEdited = eventBus.listen(WorkspaceEvents.NOTE_EDITED, onUpdate);

		return () => {
			cleanupUpdated();
			cleanupEdited();
		};
	}, [noteId, eventBus, loadNote]);

	const [isShowSkeleton, setIsShowSkeleton] = useState(true);
	const startTimeRef = useRef<number>(Date.now());
	useEffect(() => {
		const elapsed = Date.now() - startTimeRef.current;
		const delay = Math.max(0, 600 - elapsed);

		const timer = setTimeout(() => {
			setIsShowSkeleton(false);
		}, delay);

		return () => clearTimeout(timer);
	}, [note]);

	if (isShowSkeleton)
		return (
			<Skeleton
				startColor="primary.100"
				endColor="dim.400"
				height="70px"
				w="100%"
			/>
		);
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
							text={'text'}
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
