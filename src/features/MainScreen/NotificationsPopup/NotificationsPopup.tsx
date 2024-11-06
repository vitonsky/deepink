import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa6';
import { Notifications } from '@components/Notifications/Notifications';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

export const NotificationsPopup = () => {
	const { controls } = useStatusBarManager();

	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		controls.register(
			'notifications',
			{
				visible: true,
				title: 'Notifications',
				icon: <FaBell />,
				onClick: () => setIsVisible((state) => !state),
			},
			{
				placement: 'end',
				priority: 100000,
			},
		);

		return () => {
			controls.unregister('notifications');
		};
	}, [controls]);

	const onClose = () => setIsVisible(false);

	return (
		<Notifications
			isVisible={isVisible}
			onClose={onClose}
			title="Notifications"
			items={[
				'Demo message for notification',
				'One more message in notifications container',
			]}
		/>
	);
};
