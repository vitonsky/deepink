import React from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	Box,
	Button,
	HStack,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Text,
	VStack,
} from '@chakra-ui/react';

export const UnencryptedProfileModal = ({
	isOpen,
	onClose,
	onPressCreate,
}: {
	isOpen: boolean;
	onClose: () => void;
	onPressCreate: (usePassword?: boolean) => Promise<void>;
}) => {
	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose} isCentered>
				<ModalOverlay />
				<ModalContent>
					<ModalCloseButton />
					<ModalHeader>
						<Text>Unencrypted Profile Warning</Text>
					</ModalHeader>
					<ModalBody paddingBottom="1rem">
						<VStack w="100%" gap="2rem" align="start">
							<Text color="typography.secondary">
								Creating a profile without encryption may be unsafe
							</Text>

							<Box as={AutoFocusInside} w="100%">
								<HStack w="100%" justifyContent="end">
									<Button
										onClick={() => {
											onPressCreate(false);
											onClose();
										}}
									>
										Continue without encryption
									</Button>
									<Button
										variant="primary"
										type="submit"
										onClick={() => {
											onPressCreate(true);
											onClose();
										}}
									>
										Encrypt profile
									</Button>
								</HStack>
							</Box>
						</VStack>
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
};
