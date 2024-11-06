import React, { forwardRef } from 'react';
import { FaXmark } from 'react-icons/fa6';
import {
	Alert,
	AlertIcon,
	Button,
	HStack,
	Text,
	useMultiStyleConfig,
	VStack,
} from '@chakra-ui/react';

export const Notifications = forwardRef<
	HTMLDivElement,
	{ isVisible?: boolean; onClose?: () => void; title?: string; items: Array<string> }
>(({ isVisible, onClose, title, items }, ref) => {
	const styles = useMultiStyleConfig('Notifications');

	return (
		<VStack display={isVisible ? undefined : 'none'} sx={styles.root} ref={ref}>
			<HStack sx={styles.head}>
				<Text>{title}</Text>
				<VStack marginStart="auto">
					<Button variant="ghost" size="sm" onClick={onClose} paddingInline={0}>
						<FaXmark />
					</Button>
				</VStack>
			</HStack>

			<VStack sx={styles.body}>
				{items.map((message, idx) => (
					<Alert key={idx} status="info" padding=".8rem" w="100%">
						<AlertIcon />
						<Text>{message}</Text>
					</Alert>
				))}
			</VStack>
		</VStack>
	);
});
