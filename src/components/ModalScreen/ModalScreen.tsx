import React, { FC, HTMLAttributes } from 'react';
import { FaXmark } from 'react-icons/fa6';
import {
	Box,
	Button,
	HStack,
	ModalContent,
	Text,
	useMultiStyleConfig,
	VStack,
} from '@chakra-ui/react';
import { WorkspaceModal } from '@features/WorkspaceModal';

export interface ModalScreenProps extends HTMLAttributes<HTMLDivElement> {
	isVisible?: boolean;
	onClose?: () => void;
	title?: string;
}

export const ModalScreen: FC<ModalScreenProps> = ({
	isVisible,
	onClose,
	title,
	children,
	...rest
}) => {
	const styles = useMultiStyleConfig('ModalScreen');

	return (
		<WorkspaceModal
			size="full"
			isOpen={Boolean(isVisible)}
			scrollBehavior="inside"
			onClose={() => {
				if (onClose) {
					onClose();
				}
			}}
			{...rest}
		>
			<ModalContent w="100%" h="100%" sx={styles.root}>
				<VStack w="100%" h="100%" overflow="auto">
					{Boolean(title || onClose) && (
						<HStack sx={styles.head}>
							{title && (
								<Text fontSize="1.3rem" fontWeight="bold">
									{title}
								</Text>
							)}
							{onClose && (
								<Button
									variant="ghost"
									onClick={onClose}
									marginLeft="auto"
									borderRadius="100%"
									padding="0"
									width="auto"
								>
									<FaXmark />
								</Button>
							)}
						</HStack>
					)}

					<Box sx={styles.body}>
						<Box sx={styles.content}>{children}</Box>
					</Box>
				</VStack>
			</ModalContent>
		</WorkspaceModal>
	);
};
