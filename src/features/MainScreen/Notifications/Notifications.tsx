import React, { useEffect, useState } from 'react';
import { useDetectClickOutside } from 'react-detect-click-outside';
import { FaBell, FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Button, VStack } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import './Notifications.css';

export const cnNotifications = cn('Notifications');

export const Notifications = () => {
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

	const ref = useDetectClickOutside({ onTriggered: onClose });

	return (
		<div className={cnNotifications({ visible: isVisible })} ref={ref}>
			<div className={cnNotifications('Head')}>
				<div className={cnNotifications('Title')}>Notifications</div>
				<Button variant="ghost" size="s" onClick={onClose}>
					<FaXmark />
				</Button>
			</div>
			<VStack className={cnNotifications('Body')}>
				<div className={cnNotifications('Notification')}>
					Demo message for notification
				</div>
				<div className={cnNotifications('Notification')}>
					One more message in notifications container
				</div>
			</VStack>
		</div>
	);
};
