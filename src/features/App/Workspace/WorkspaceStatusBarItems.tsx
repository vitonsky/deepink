import React from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { useDispatch } from 'react-redux';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useFirstRender } from '@hooks/useFirstRender';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();
	const dispatch = useDispatch();

	// Profile controls on status bar
	const profileControls = useProfileControls();
	useFirstRender(() => {
		statusBarButtons.controls.register(
			'changeProfile',
			{
				visible: true,
				title: 'Change profile',
				onClick: () => {
					dispatch(workspacesApi.setActiveProfile(null));
					profileControls.close();
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
