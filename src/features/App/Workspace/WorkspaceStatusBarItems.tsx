import React from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useFirstRender } from '@hooks/useFirstRender';

import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';
import { PROFILE_SCREEN } from '..';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();
	const command = useCommand();

	// Profile controls on status bar
	const profileControls = useProfileControls();
	useFirstRender(() => {
		statusBarButtons.controls.register(
			'changeProfile',
			{
				visible: true,
				title: 'Change profile',
				onClick: () => {
					profileControls.close();
					command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
						screen: PROFILE_SCREEN.CHANGE,
					});
				},
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
