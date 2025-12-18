import React from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useFirstRender } from '@hooks/useFirstRender';
import { useAppDispatch } from '@state/redux/hooks';
import { PROFILE_SCREEN_MODE, workspacesApi } from '@state/redux/profiles/profiles';

import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();
	const dispatch = useAppDispatch();

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
					dispatch(
						workspacesApi.setProfileScreenMode(PROFILE_SCREEN_MODE.CHANGE),
					);
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
