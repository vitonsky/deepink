import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBell } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Notifications } from '@components/Notifications/Notifications';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

export const NotificationsPopup = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const { controls } = useStatusBarManager();

	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		controls.register(
			'notifications',
			{
				visible: true,
				title: t('notifications.title'),
				icon: <FaBell />,
				onClick: () => setIsVisible((state) => !state),
			},
			{
				placement: 'end',
				priority: 100_000,
			},
		);

		return () => {
			controls.unregister('notifications');
		};
	}, [controls, t]);

	const onClose = () => setIsVisible(false);

	return (
		<Notifications
			isVisible={isVisible}
			onClose={onClose}
			title={t('notifications.title')}
			items={[
				'Demo message for notification',
				'One more message in notifications container',
			]}
		/>
	);
};
