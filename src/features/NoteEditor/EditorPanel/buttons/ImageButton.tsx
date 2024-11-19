import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { FaImage } from 'react-icons/fa6';
import {
	Box,
	Button,
	ButtonProps,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	Text,
	VStack,
} from '@chakra-ui/react';
import { useModalWindow } from '@components/useModalWindow';

import { PropertiesForm } from '../../RichEditor/ContextMenu/ObjectPropertiesEditor';

import { InsertingPayloadMap } from '..';

export const ImageButton: FC<
	ButtonProps & {
		onPick: (payload: InsertingPayloadMap['image']) => void;
	}
> = ({ onPick }) => {
	const { show } = useModalWindow();

	return (
		<>
			<Button
				size="sm"
				variant="ghost"
				onClick={() => {
					show({
						content: ({ onClose }) => (
							<>
								<ModalCloseButton />
								<ModalHeader>
									<Text>Add image</Text>
								</ModalHeader>
								<ModalBody paddingBottom="1rem">
									<VStack w="100%" gap="1rem" align="start">
										<Text color="typography.secondary">
											Image will be inserted at cursor position.
										</Text>

										<Box as={AutoFocusInside} w="100%">
											<PropertiesForm
												options={[
													{
														id: 'url',
														value: '',
														label: 'Image url',
													},
													{
														id: 'altText',
														value: '',
														label: 'Image alt text (optional)',
													},
												]}
												onUpdate={({ url, altText }) => {
													onClose();

													if (url) {
														onPick({ url, altText });
													}
												}}
												submitButtonText="Add"
											/>
										</Box>
									</VStack>
								</ModalBody>
							</>
						),
					});
				}}
			>
				<FaImage />
			</Button>
		</>
	);
};
