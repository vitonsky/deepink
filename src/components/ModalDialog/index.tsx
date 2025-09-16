import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	Button,
	HStack,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
} from '@chakra-ui/react';

export type ModalDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	confirmButtonText: string;
	onConfirm: () => void;
	cancelButtonText?: string;
	onCancel?: () => void;
};

export const ModalDialog: FC<ModalDialogProps> = ({
	isOpen,
	onClose,
	title,
	description,
	confirmButtonText,
	onConfirm,
	cancelButtonText,
	onCancel,
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} isCentered>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<Text color="typography.secondary">{description}</Text>
				</ModalBody>
				<ModalFooter>
					<HStack w="100%" justifyContent="end" as={AutoFocusInside}>
						{cancelButtonText && onCancel && (
							<Button
								onClick={() => {
									onCancel();
									onClose();
								}}
							>
								{cancelButtonText}
							</Button>
						)}
						<Button
							variant="primary"
							onClick={() => {
								onConfirm();
								onClose();
							}}
						>
							{confirmButtonText}
						</Button>
					</HStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
