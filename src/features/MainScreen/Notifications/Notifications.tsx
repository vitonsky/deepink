import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaXmark } from 'react-icons/fa6';
import { Button, Card, HStack, Text, useOutsideClick, VStack } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

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

	const ref = useRef<HTMLDivElement>(null);
	useOutsideClick({
		ref,
		handler: onClose,
	});

	return (
		<VStack
			sx={{
				display: isVisible ? undefined : 'none',
				position: 'absolute',
				bottom: '2rem',
				right: '0.5rem',
				backgroundColor: 'surface.background',
				border: '2px solid #eee',
				borderRadius: '4px',
				minWidth: '300px',
				maxWidth: '500px',
				maxHeight: '500px',
				boxShadow: '0 5px 30px -20px black',
			}}
			ref={ref}
		>
			<HStack w="100%" padding="1rem">
				<Text>Notifications</Text>
				<VStack marginStart="auto">
					<Button variant="ghost" size="sm" onClick={onClose}>
						<FaXmark />
					</Button>
				</VStack>
			</HStack>

			<VStack w="100%" alignItems="start" padding="1rem">
				{[
					'Demo message for notification',
					'One more message in notifications container',
				].map((message, idx) => (
					<Card key={idx} padding="1rem" w="100%" variant="outline">
						{message}
					</Card>
				))}
			</VStack>
		</VStack>
	);
};
