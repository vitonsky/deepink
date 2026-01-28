import React from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useFirstRender } from '@hooks/useFirstRender';

import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();

	// Profile controls on status bar
	const profileControls = useProfileControls();
	useFirstRender(() => {
		statusBarButtons.controls.register(
			'changeProfile',
			{
				visible: true,
				title: 'Change profile',
				onClick: () => profileControls.close({ resetActiveProfile: true }),
				icon: <FaUserLarge />,
			},
			{
				placement: 'start',
				priority: 1,
			},
		);
	});

	useActiveNoteHistoryButton();

	return null;
};
