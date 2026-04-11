import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaClockRotateLeft } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/profiles/profiles';

export const useActiveNoteHistoryButton = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const runCommand = useCommand();

	// Note items on status bar
	const statusBarButtons = useStatusBarManager();
	useEffect(() => {
		const note =
			activeNoteId !== null && openedNotes.find((note) => note.id === activeNoteId);
		if (!note) return;

		const noteDate = note.updatedTimestamp
			? new Date(note.updatedTimestamp).toLocaleDateString()
			: null;

		statusBarButtons.controls.register(
			'noteTime',
			{
				visible: noteDate !== null,
				title: t('statusBar.history'),
				icon: <FaClockRotateLeft />,
				text: noteDate ?? '',
				onClick: () =>
					runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL, {
						noteId: activeNoteId,
					}),
			},
			{
				placement: 'end',
				priority: 1000,
			},
		);

		return () => {
			statusBarButtons.controls.unregister('noteTime');
		};
	}, [activeNoteId, statusBarButtons.controls, openedNotes, runCommand, t]);
};
