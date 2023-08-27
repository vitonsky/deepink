import React, { FC, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { LayerManager } from 'react-elegant-ui/esm/components/LayerManager/LayerManager';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { Modal } from 'react-elegant-ui/esm/components/Modal/Modal.bundle/desktop';
import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cn } from '@bem-react/classname';

import { ITag } from '../../../../../core/Registry/Tags/Tags';

import { getSortIndex } from './utils';

import './TagEditor.css';

export const cnTagEditor = cn('TagEditor');

type TagEditorData = {
	name: string;
	parent: string | null;
};

type ITagEditorProps = {
	/**
	 * Available tags
	 */
	tags: ITag[];
	parentTag?: ITag;
	onSave: (tagData: TagEditorData) => void;
	onCancel: () => void;
	editedTag?: TagEditorData;
};

export const TagEditor: FC<ITagEditorProps> = ({ tags, parentTag, editedTag, onSave, onCancel }) => {
	const [parentTagId, setParentTagId] = useState<string | null>(
		parentTag ? parentTag.id : null,
	);
	const [parentTagName, setParentTagName] = useState(
		parentTag ? parentTag.resolvedName : '',
	);

	const [tagName, setTagName] = useState(editedTag ? editedTag.name : '');
	const [tagNameError, setTagNameError] = useState<string | null>(null);
	const [isTagsListVisible, setIsTagsListVisible] = useState(false);

	const isEditingMode = editedTag !== undefined;

	useEffect(() => {
		setTagNameError(null);
	}, [tagName, parentTagId, isEditingMode]);

	useEffect(() => {
		if (isTagsListVisible) return;

		const parentTag = tags.find(({ id }) => id === parentTagId);
		setParentTagName(parentTag ? parentTag.resolvedName : '');
	}, [isTagsListVisible, parentTagId, tags]);

	const parentTagInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const tagsItems = [...tags]
		.filter(
			({ resolvedName }) =>
				parentTagName.trim().length === 0 || resolvedName.includes(parentTagName),
		)
		.sort((a, b) => {
			const segments = parentTagName.split('/');
			if (segments.length > 1) {
				return getSortIndex(a.resolvedName, b.resolvedName, parentTagName);
			}

			const aLastSegment = a.resolvedName.split('/').slice(-1)[0];
			const bLastSegment = b.resolvedName.split('/').slice(-1)[0];
			return getSortIndex(aLastSegment, bLastSegment, parentTagName);
		})
		.map(({ id, resolvedName }) => ({ id, content: resolvedName }));

	useEffect(() => {
		const isEmptyValue = parentTagName.trim().length === 0;
		if (isEmptyValue) {
			setParentTagId(null);
		}
	}, [parentTagName]);

	useEffect(() => {
		const parentTag = tags.find(({ id }) => id === parentTagId);
		setParentTagName(parentTag ? parentTag.resolvedName : '');
	}, [parentTagId, tags]);

	useEffect(() => {
		if (!parentTag) return;

		setParentTagId(parentTag.id);
		setParentTagName(parentTag.resolvedName);
	}, [parentTag]);

	return (
		<LayerManager essentialRefs={[]}>
			<Modal
				visible
				view="default"
				className={cnTagEditor()}
				innerRef={modalRef}
			>
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
							// setTimeout(() => {
							// 	setIsTagsListVisible(false);
							// }, 200);
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

							if (!isEditingMode) {
								const parentTag = tags.find(({ id }) => id === parentTagId);
								const fullName = [parentTag?.resolvedName, name].filter(Boolean).join('/');

								const isTagExists = tags.some(({ resolvedName }) => resolvedName === fullName);
								if (isTagExists) {
									setTagNameError('Tag already exists');
									return;
								}
							}

							onSave({
								name,
								parent: parentTagId,
							});
						}}
					>
						{isEditingMode ? 'Save' : 'Add'}
					</Button>
					<Button onPress={onCancel}>Cancel</Button>
				</div>
				{tagsItems.length > 0 && isTagsListVisible && (
					<Popup
						target="anchor"
						anchor={parentTagInputRef}
						view="default"
						visible
						direction={['bottom-start', 'bottom', 'bottom-end']}
						boundary={modalRef}
					>
						{/* {tags.map((tag) => <div key={tag.id}>{tag.resolvedName}</div>)} */}
						<Menu
							className={cnTagEditor('TagsListInPopup')}
							items={tagsItems}
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