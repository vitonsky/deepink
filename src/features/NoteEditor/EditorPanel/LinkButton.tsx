import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { FaLink } from 'react-icons/fa6';
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

import { PropertiesForm } from '../RichEditor/ContextMenu/ObjectPropertiesEditor';
import { InsertingPayloadMap } from '.';

export const LinkButton: FC<
	ButtonProps & {
		onPick: (payload: InsertingPayloadMap['link']) => void;
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
									<Text>Add link</Text>
								</ModalHeader>
								<ModalBody paddingBottom="1rem">
									<VStack w="100%" gap="1rem">
										<Text color="typography.secondary">
											Selected text become a link, or link will be
											added at cursor position if nothing selected.
										</Text>

										<Box as={AutoFocusInside} w="100%">
											<PropertiesForm
												options={[
													{
														id: 'url',
														value: '',
														label: 'Link url',
													},
												]}
												onUpdate={({ url }) => {
													onClose();

													if (url) {
														onPick({ url });
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
				<FaLink />
			</Button>
		</>
	);
};
