import React from 'react';
import { FaLock, FaUserLarge } from 'react-icons/fa6';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useFirstRender } from '@hooks/useFirstRender';

import { useCommandSubscription } from '../hotkey/commandHooks';
import { SHORTCUT_COMMANDS } from '../hotkey/shortcuts';
import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();

	// Profile controls on status bar
	const profileControls = useProfileControls();

	useCommandSubscription((data) => {
		if (data.id !== SHORTCUT_COMMANDS.LOCK_PROFILE) return;
		profileControls.close();
	});

	useFirstRender(() => {
		statusBarButtons.controls.register(
			'dbChange',
			{
				visible: true,
				title: 'Change database',
				onClick: () => profileControls.close(),
				icon: <FaUserLarge />,
			},
			{
				placement: 'start',
				priority: 1,
			},
		);
		statusBarButtons.controls.register(
			'dbLock',
			{
				visible: true,
				title: 'Lock database',
				icon: <FaLock />,
			},
			{
				placement: 'start',
				priority: 2,
			},
		);
	});

	useActiveNoteHistoryButton();

	return null;
};
