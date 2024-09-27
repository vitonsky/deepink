import React from 'react';
import { FaArrowsRotate, FaLock, FaUserLarge } from 'react-icons/fa6';
import { useFirstRender } from '@components/hooks/useFirstRender';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { useProfileControls } from '../Profile';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();

	// Profile controls on status bar
	const profileControls = useProfileControls();
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
		statusBarButtons.controls.register(
			'sync',
			{
				visible: true,
				title: 'Sync changes',
				icon: <FaArrowsRotate />,
			},
			{
				placement: 'start',
				priority: 3,
			},
		);
	});

	return null;
};
