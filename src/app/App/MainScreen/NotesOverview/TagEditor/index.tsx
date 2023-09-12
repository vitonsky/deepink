import React, { FC, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { LayerManager } from 'react-elegant-ui/esm/components/LayerManager/LayerManager';
import { Modal } from 'react-elegant-ui/esm/components/Modal/Modal.bundle/desktop';
import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cn } from '@bem-react/classname';

import { ITag } from '../../../../../core/Registry/Tags/Tags';

import { SuggestedTagsList } from '../../../../components/SuggestedTagsList';

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
	tags: ITag[];
	parentTag?: ITag;
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

	const parentTagInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	return (
		<LayerManager essentialRefs={[]}>
			<Modal visible view="default" className={cnTagEditor()} innerRef={modalRef}>
				<Textinput
					placeholder="Parent tag"
					value={parentTagName}
					onChange={(evt) => {
						console.log('change');
						setParentTagName(evt.target.value);
					}}
					controlProps={{
						innerRef: parentTagInputRef,
						onFocus: () => {
							setIsTagsListVisible(true);
						},
						onBlur: () => {
							setIsTagsListVisible(false);
						},
						onKeyDown: () => {
							setIsTagsListVisible(true);
						},
						onClick: () => {
							setIsTagsListVisible(true);
						},
					}}
				/>
				<Textinput
					placeholder="Tag name"
					value={tagName}
					onChange={(evt) => {
						setTagName(evt.target.value);
					}}
					hint={tagNameError ?? undefined}
					state={tagNameError ? 'error' : undefined}
				/>
				<div className={cnTagEditor('Controls')}>
					<Button
						view="action"
						onPress={() => {
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

							const parentTag = tags.find(({ id }) => id === parentTagId);
							const fullName = [parentTag?.resolvedName, name]
								.filter(Boolean)
								.join('/');

							const isTagExists = tags.some(({ id, resolvedName }) => {
								const isItEditedTag = editedTag && editedTag.id === id;
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
					<Button onPress={onCancel}>Cancel</Button>
				</div>
				{isTagsListVisible && (
					<Popup
						target="anchor"
						anchor={parentTagInputRef}
						view="default"
						visible
						direction={['bottom-start', 'bottom', 'bottom-end']}
						boundary={modalRef}
					>
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
					</Popup>
				)}
			</Modal>
		</LayerManager>
	);
};
