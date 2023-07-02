import React, { FC } from 'react';
import { Icon } from 'react-elegant-ui/esm/components/Icon/Icon.bundle/desktop';
import { TabsMenu } from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';

import { getNoteTitle } from '../..';

import './TopBar.css';

export const cnTopBar = cn('TopBar');

export type TopBarProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;
	onPick: (id: NoteId) => void;
	onClose: (id: NoteId) => void;

	notes: INote[];
};

// TODO: improve tabs style
export const TopBar: FC<TopBarProps> = ({ notes, tabs, activeTab, onClose, onPick }) => {
	return <TabsMenu
		view="primitive"
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
						<span>
							{getNoteTitle(note.data)}{' '}
							<span
								onClick={(evt) => {
									evt.stopPropagation();
									onClose(noteId);
								}}
							>
								<Icon glyph="cancel" size="s" />
							</span>
						</span>
					),
				};
			})}
	/>;
};