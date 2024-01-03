import React, { FC } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
import { INotesRegistry } from '../../../../core/Registry';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { TabsMenu } from '../../../components/TabsMenu';

import { getNoteTitle } from '../..';
import { useDefaultNoteContextMenu } from '../NotesList/NoteContextMenu/useDefaultNoteContextMenu';

import './TopBar.css';

export const cnTopBar = cn('TopBar');

export type TopBarProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;
	onPick: (id: NoteId) => void;
	onClose: (id: NoteId) => void;

	notes: INote[];

	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesRegistry;
};

// TODO: improve tabs style
export const TopBar: FC<TopBarProps> = ({
	notes,
	tabs,
	activeTab,
	onClose,
	onPick,
	updateNotes,
	notesRegistry,
}) => {
	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: onClose,
		notesRegistry,
		updateNotes,
	});

	return (
		<TabsMenu
			view="primary"
			layout="horizontal"
			dir="horizontal"
			className={cnTopBar()}
			activeTab={activeTab || undefined}
			setActiveTab={onPick}
			tabs={tabs
				.filter((noteId) => notes.some((note) => note.id === noteId))
				.map((noteId) => {
					// TODO: handle case when object not found
					const note = notes.find((note) => note.id === noteId);
					if (!note) {
						throw new Error('Note not found');
					}

					return {
						id: noteId,
						content: (
							<>
								<span
									onContextMenu={(evt) => {
										openNoteContextMenu(note.id, {
											x: evt.pageX,
											y: evt.pageY,
										});
									}}
								>
									{getNoteTitle(note.data)}{' '}
								</span>
								<span
									className={cnTopBar('CloseButton')}
									onClick={(evt) => {
										evt.stopPropagation();
										onClose(noteId);
									}}
								>
									<Icon boxSize="1rem" hasGlyph>
										<FaXmark size="100%" />
									</Icon>
								</span>
							</>
						),
					};
				})}
		/>
	);
};
