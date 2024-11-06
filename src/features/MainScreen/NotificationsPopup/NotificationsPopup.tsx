import React, { useEffect, useRef, useState } from 'react';
import { FaBell } from 'react-icons/fa6';
import { useOutsideClick } from '@chakra-ui/react';
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

	const ref = useRef<HTMLDivElement>(null);
	useOutsideClick({
		ref,
		handler: onClose,
	});

	return (
		<Notifications
			ref={ref}
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
