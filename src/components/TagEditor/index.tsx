import React, { FC, useEffect, useState } from 'react';
import {
	Button,
	FormControl,
	FormErrorMessage,
	HStack,
	Input,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	VStack,
} from '@chakra-ui/react';
import { IResolvedTag } from '@core/features/tags';
import {
	checkTagUniqueness,
	validateTagName,
} from '@core/features/tags/controller/utils';
import { WorkspaceModal } from '@features/WorkspaceModal';

import { SuggestedTagsList } from '../SuggestedTagsList';

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
	const [selectedParentTag, setSelectedParentTag] = useState<IResolvedTag | null>(
		parentTag ? parentTag : null,
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
		setSelectedParentTag(parentTag);
	}, [parentTag]);

	// Remove parent tag
	useEffect(() => {
		if (!selectedParentTag) {
			setParentTagId(null);
		}
	}, [selectedParentTag]);

	// Reset parent tag name
	useEffect(() => {
		if (isTagsListVisible) return;

		const parentTag = tags.find(({ id }) => id === parentTagId);
		setSelectedParentTag(parentTag ? parentTag : null);
	}, [isTagsListVisible, parentTagId, tags]);

	// Set parent tag name
	useEffect(() => {
		const parentTag = tags.find(({ id }) => id === parentTagId);
		setSelectedParentTag(parentTag ? parentTag : null);
	}, [parentTagId, tags]);

	return (
		<WorkspaceModal isOpen onClose={onCancel} isCentered>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>{isEditingMode ? 'Edit tag' : 'Add tag'}</ModalHeader>

				<ModalBody>
					<VStack>
						<SuggestedTagsList
							placeholder="Parent tag"
							tags={tags}
							selectedTag={selectedParentTag ?? undefined}
							onPick={(tag) => {
								setParentTagId(tag.id);
								setIsTagsListVisible(false);
							}}
						/>

						<FormControl isInvalid={tagNameError !== null}>
							<Input
								placeholder="Tag name"
								value={tagName}
								onChange={(evt) => {
									setTagName(evt.target.value);
								}}
							/>

							{tagNameError && (
								<FormErrorMessage>{tagNameError}</FormErrorMessage>
							)}
						</FormControl>
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

								const isTagNameValid = validateTagName(name);
								const isTagNameUnique = checkTagUniqueness(
									name,
									parentTagId,
									tags,
								);
								if (!isTagNameValid.valid || !isTagNameUnique.valid) {
									setTagNameError(
										isTagNameValid.message ??
											isTagNameUnique.message ??
											'Invalid tag',
									);
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
		</WorkspaceModal>
	);
};
