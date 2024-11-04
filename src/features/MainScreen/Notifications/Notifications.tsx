import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaXmark } from 'react-icons/fa6';
import {
	Alert,
	AlertIcon,
	Button,
	HStack,
	Text,
	useMultiStyleConfig,
	useOutsideClick,
	VStack,
} from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

export const Notifications = () => {
	const styles = useMultiStyleConfig('Notifications');

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
		<VStack display={isVisible ? undefined : 'none'} sx={styles.root} ref={ref}>
			<HStack sx={styles.head}>
				<Text>Notifications</Text>
				<VStack marginStart="auto">
					<Button variant="ghost" size="sm" onClick={onClose} paddingInline={0}>
						<FaXmark />
					</Button>
				</VStack>
			</HStack>

			<VStack sx={styles.body}>
				{[
					'Demo message for notification',
					'One more message in notifications container',
				].map((message, idx) => (
					<Alert key={idx} status="info" padding=".8rem" w="100%">
						<AlertIcon />
						<Text>{message}</Text>
					</Alert>
				))}
			</VStack>
		</VStack>
	);
};
