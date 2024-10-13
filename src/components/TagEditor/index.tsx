import React, { FC, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import {
	Button,
	FormControl,
	FormErrorMessage,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Popover,
	PopoverContent,
	PopoverTrigger,
	VStack,
} from '@chakra-ui/react';
import { IResolvedTag } from '@core/features/tags';

import { SuggestedTagsList } from '../SuggestedTagsList';

import './TagEditor.css';

export const cnTagEditor = cn('TagEditor');

export type TagEditorData = {
	id?: string;
	name: string;
	parent: string | null;
};

export type ITagEditorProps = {
	/**
	 * Available tags
	 */
	tags: IResolvedTag[];
	parentTag?: IResolvedTag;
	onSave: (tagData: TagEditorData) => void;
	onCancel: () => void;
	editedTag?: TagEditorData;
};

export const TagEditor: FC<ITagEditorProps> = ({
	tags,
	parentTag,
	editedTag,
	onSave,
	onCancel,
}) => {
	const isEditingMode = editedTag !== undefined;

	const [parentTagId, setParentTagId] = useState<string | null>(
		parentTag ? parentTag.id : null,
	);
	const [parentTagName, setParentTagName] = useState(
		parentTag ? parentTag.resolvedName : '',
	);

	const [tagName, setTagName] = useState(editedTag ? editedTag.name : '');
	const [tagNameError, setTagNameError] = useState<string | null>(null);
	const [isTagsListVisible, setIsTagsListVisible] = useState(false);

	// Reset errors
	useEffect(() => {
		setTagNameError(null);
	}, [tagName, parentTagId, isEditingMode]);

	// Reset parent tag
	useEffect(() => {
		if (!parentTag) return;

		setParentTagId(parentTag.id);
		setParentTagName(parentTag.resolvedName);
	}, [parentTag]);

	// Remove parent tag
	useEffect(() => {
		const isEmptyValue = parentTagName.trim().length === 0;
		if (isEmptyValue) {
			setParentTagId(null);
		}
	}, [parentTagName]);

	// Reset parent tag name
	useEffect(() => {
		if (isTagsListVisible) return;

		const parentTag = tags.find(({ id }) => id === parentTagId);
		setParentTagName(parentTag ? parentTag.resolvedName : '');
	}, [isTagsListVisible, parentTagId, tags]);

	// Set parent tag name
	useEffect(() => {
		const parentTag = tags.find(({ id }) => id === parentTagId);
		setParentTagName(parentTag ? parentTag.resolvedName : '');
	}, [parentTagId, tags]);

	return (
		<Modal isOpen onClose={onCancel} isCentered>
			<ModalOverlay />
			<ModalContent className={cnTagEditor()}>
				<ModalCloseButton />
				<ModalHeader>{isEditingMode ? 'Edit tag' : 'Add tag'}</ModalHeader>

				<ModalBody>
					<VStack>
						<Popover
							isOpen={isTagsListVisible}
							autoFocus={false}
							closeOnBlur={false}
							returnFocusOnClose={false}
						>
							<PopoverTrigger>
								<FormControl isInvalid={tagNameError !== null}>
									<Input
										placeholder="Parent tag"
										value={parentTagName}
										onChange={(evt) => {
											console.log('change');
											setParentTagName(evt.target.value);
										}}
										onFocus={() => {
											setIsTagsListVisible(true);
										}}
										onBlur={() => {
											setIsTagsListVisible(false);
										}}
										onKeyDown={() => {
											setIsTagsListVisible(true);
										}}
										onClick={() => {
											setIsTagsListVisible(true);
										}}
									/>

									{tagNameError && (
										<FormErrorMessage>
											{tagNameError}
										</FormErrorMessage>
									)}
								</FormControl>
							</PopoverTrigger>
							<PopoverContent>
								<SuggestedTagsList
									tags={tags}
									tagName={parentTagName}
									onMouseDown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onPick={(id) => {
										setParentTagId(id);
										setIsTagsListVisible(false);
									}}
								/>
							</PopoverContent>
						</Popover>
						<Input
							placeholder="Tag name"
							value={tagName}
							onChange={(evt) => {
								setTagName(evt.target.value);
							}}
						/>
					</VStack>
				</ModalBody>

				<ModalFooter>
					<HStack w="100%" justifyContent="end">
						<Button variant="secondary" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={() => {
								const name = tagName.trim();

								if (name.length === 0) {
									setTagNameError('Name must not be empty');
									return;
								}

								if (isEditingMode) {
									const isHaveSeparatorChar = name.includes('/');
									if (isHaveSeparatorChar) {
										setTagNameError(
											'Name of tag for editing cannot create sub tags',
										);
										return;
									}
								}

								const parentTag = tags.find(
									({ id }) => id === parentTagId,
								);
								const fullName = [parentTag?.resolvedName, name]
									.filter(Boolean)
									.join('/');

								const isTagExists = tags.some(({ id, resolvedName }) => {
									const isItEditedTag =
										editedTag && editedTag.id === id;
									return resolvedName === fullName && !isItEditedTag;
								});
								if (isTagExists) {
									setTagNameError('Tag already exists');
									return;
								}

								const editedData: TagEditorData = {
									name,
									parent: parentTagId,
								};

								if (isEditingMode && editedTag.id) {
									editedData.id = editedTag.id;
								}

								onSave(editedData);
							}}
						>
							{isEditingMode ? 'Save' : 'Add'}
						</Button>
					</HStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
