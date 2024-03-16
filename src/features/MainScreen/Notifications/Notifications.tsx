import React, { useEffect, useState } from 'react';
import { useDetectClickOutside } from 'react-detect-click-outside';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { FaBell, FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { useBottomPanelManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import './Notifications.css';

export const cnNotifications = cn('Notifications');

export const Notifications = () => {
	const { manager } = useBottomPanelManager();

	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		manager.register(
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
			manager.unregister('notifications');
		};
	}, [manager]);

	const onClose = () => setIsVisible(false);

	const ref = useDetectClickOutside({ onTriggered: onClose });

	return (
		<div className={cnNotifications({ visible: isVisible })} ref={ref}>
			<div className={cnNotifications('Head')}>
				<div className={cnNotifications('Title')}>Notifications</div>
				<Button view="clear" size="s" onPress={onClose}>
					<Icon hasGlyph scalable boxSize=".8rem">
						<FaXmark />
					</Icon>
				</Button>
			</div>
			<Stack direction="vertical" spacing={2} className={cnNotifications('Body')}>
				<div className={cnNotifications('Notification')}>
					Demo message for notification
				</div>
				<div className={cnNotifications('Notification')}>
					One more message in notifications container
				</div>
			</Stack>
		</div>
	);
};
