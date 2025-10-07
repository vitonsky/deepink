import React, { useEffect } from 'react';
import { FaDatabase } from 'react-icons/fa6';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useIsDeveloper } from '@hooks/useIsDeveloper';

const BUTTON_ID = 'sql-dev-tools';

export const ToggleSQLConsole = ({
	isVisible,
	onVisibilityChange,
}: {
	isVisible: boolean;
	onVisibilityChange: (state: boolean) => void;
}) => {
	const { controls } = useStatusBarManager();

	const isDeveloper = useIsDeveloper();

	const toggle = useImmutableCallback(() => {
		onVisibilityChange(!isVisible);
	}, [isVisible, onVisibilityChange]);

	useEffect(() => {
		if (!isDeveloper) return;

		controls.register(
			BUTTON_ID,
			{
				visible: true,
				title: 'Toggle SQL console',
				icon: <FaDatabase />,
				onClick: toggle,
			},
			{
				placement: 'start',
				priority: 100,
			},
		);

		return () => {
			controls.unregister(BUTTON_ID);
		};
	}, [controls, isDeveloper, toggle]);

	return null;
};
