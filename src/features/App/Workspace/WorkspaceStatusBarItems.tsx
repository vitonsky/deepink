import React from 'react';
import { FaLock, FaUserLarge } from 'react-icons/fa6';
import { useHotKeyEvents } from '@features/MainScreen/HotkeyProvaider';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useEventSubscribe } from '@features/MainScreen/useHotKey';
import { useFirstRender } from '@hooks/useFirstRender';

import { useProfileControls } from '../Profile';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const statusBarButtons = useStatusBarManager();

	// Profile controls on status bar
	const profileControls = useProfileControls();

	const { lockProfileEvent } = useHotKeyEvents();
	useEventSubscribe(lockProfileEvent, () => {
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
