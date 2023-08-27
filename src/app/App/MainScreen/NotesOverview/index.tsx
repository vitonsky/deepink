import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { LayerManager } from 'react-elegant-ui/esm/components/LayerManager/LayerManager';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { Modal } from 'react-elegant-ui/esm/components/Modal/Modal.bundle/desktop';
import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { useStore } from 'effector-react';
import { cn } from '@bem-react/classname';

import { ITag } from '../../../../core/Registry/Tags/Tags';
import { $activeTag, setActiveTag } from '../../../../core/state/notes';
import { useTagsRegistry } from '../../Providers';

import { List } from './List';
import { TagItem, TagsList } from './TagsList';

import './NotesOverview.css';

function findSubstr(src: string, search: string, reverse = false) {
	const reverseString = (str: string) => str.split('').reverse().join('');

	if (reverse) {
		src = reverseString(src);
		search = reverseString(search);
	}

	let substr = '';
	for (let i = 0; src.length > i && search.length > i && src[i] === search[i]; i++) {
		substr += src[i];
	}

	if (reverse) {
		return reverseString(substr);
	}

	return substr;
}

const getSortIndex = (a: string, b: string, value: string) => {
	const left = -1;
	const right = 1;

	const isASubstringMatch = a.search(value);
	const aMatchFromStart = findSubstr(a, value);
	const aMatchFromEnd = findSubstr(a, value, true);
	const isAFullMatch = aMatchFromStart.length === a.length;
	const aBestMatch = Math.max(aMatchFromStart.length, aMatchFromEnd.length);

	const isBSubstringMatch = b.search(value);
	const bMatchFromStart = findSubstr(b, value);
	const bMatchFromEnd = findSubstr(b, value, true);
	const isBFullMatch = bMatchFromStart.length === b.length;
	const bBestMatch = Math.max(bMatchFromStart.length, bMatchFromEnd.length);

	// Prefer full match
	if (isAFullMatch && isBFullMatch) return 0;
	if (isAFullMatch) return left;
	if (isBFullMatch) return right;

	// Prefer substring match
	if (isASubstringMatch !== isBSubstringMatch) {
		if (isASubstringMatch) return left;
		if (isBSubstringMatch) return right;
	}

	// Prefer a string with most large match chars from start or from end
	if (aBestMatch > bBestMatch) return left;
	if (aBestMatch < bBestMatch) return right;

	return 0;
};

export const cnNotesOverview = cn('NotesOverview');

type TagEditorData = {
	name: string;
	parent: string | null;
};

type ITagEditorProps = {
	tags: ITag[];
	parentTag?: ITag;
	onSave: (tagData: TagEditorData) => void;
	onCancel: () => void;
};

const TagEditor: FC<ITagEditorProps> = ({ tags, parentTag, onSave, onCancel }) => {
	const [parentTagId, setParentTagId] = useState<string | null>(
		parentTag ? parentTag.id : null,
	);
	const [parentTagName, setParentTagName] = useState(
		parentTag ? parentTag.resolvedName : '',
	);
	const [tagName, setTagName] = useState('');
	const [tagNameError, setTagNameError] = useState<string | null>(null);
	const [isTagsListVisible, setIsTagsListVisible] = useState(false);

	useEffect(() => {
		setTagNameError(null);
	}, [tagName, parentTagId]);

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
				className={cnNotesOverview('TagEditor')}
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
				<div className={cnNotesOverview('TagEditorControls')}>
					<Button
						view="action"
						onPress={() => {
							const name = tagName.trim();

							const parentTag = tags.find(({ id }) => id === parentTagId);
							const fullName = [parentTag?.resolvedName, name].filter(Boolean).join('/');

							const isTagExists = tags.some(({ resolvedName }) => resolvedName === fullName);
							if (isTagExists) {
								setTagNameError('Tag already exists');
								return;
							}

							if (name.length === 0) {
								setTagNameError('Name must not be empty');
								return;
							}

							onSave({
								name,
								parent: parentTagId,
							});
						}}
					>
						Add
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
							className={cnNotesOverview('TagsListInPopup')}
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

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const [tagsTree, setTagsTree] = useState<TagItem[]>([]);
	const [tags, setTags] = useState<ITag[]>([]);

	const activeTag = useStore($activeTag);

	const tagsRegistry = useTagsRegistry();
	const updateTags = useCallback(async () => {
		const flatTags = await tagsRegistry.getTags();

		setTags(flatTags);
		const tagsMap: Record<string, TagItem> = {};
		const tagToParentMap: Record<string, string> = {};

		// Fill maps
		flatTags.forEach(({ id, name, parent }) => {
			tagsMap[id] = {
				id,
				content: name,
			};

			if (parent !== null) {
				tagToParentMap[id] = parent;
			}
		});

		// Attach tags to parents
		for (const tagId in tagToParentMap) {
			const parentId = tagToParentMap[tagId];

			const tag = tagsMap[tagId];
			const parentTag = tagsMap[parentId];

			// Create array
			if (!parentTag.childrens) {
				parentTag.childrens = [];
			}

			// Attach tag to another tag
			parentTag.childrens.push(tag);
		}

		// Delete nested tags from tags map
		Object.keys(tagToParentMap).forEach((nestedTagId) => {
			delete tagsMap[nestedTagId];
		});

		// Collect tags array from a map
		const nestedTags = Object.values(tagsMap);
		setTagsTree(nestedTags);
	}, [tagsRegistry]);

	useEffect(() => {
		updateTags();

		// Run once for init state
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [isAddTagPopupOpened, setIsAddTagPopupOpened] = useState(false);

	// TODO: show spinner while loading tags
	return (
		<>
			<List
				classNameExtensions={{ ItemBody: cnNotesOverview('MenuItem') }}
				items={[{ id: 'all', content: 'All notes' }]}
				activeItem={activeTag === null ? 'all' : undefined}
				onPick={(id) => {
					if (id === 'all') {
						setActiveTag(null);
					}
				}}
			/>

			<div className={cnNotesOverview('Tags')}>
				<div className={cnNotesOverview('TagsControls')}>
					<h2>Tags</h2>

					<Button view="clear" onPress={() => {
						setIsAddTagPopupOpened(true);
					}}>+</Button>
				</div>

				<TagsList
					tags={tagsTree}
					activeTag={activeTag ?? undefined}
					onTagClick={setActiveTag}
				/>
			</div>

			{isAddTagPopupOpened && <TagEditor tags={tags} parentTag={tags.length > 0 ? tags[0] : undefined} onSave={async (data) => {
				console.warn('Create tag', data);
				await tagsRegistry.add(data.name, data.parent);
				await updateTags();
				setIsAddTagPopupOpened(false);
			}} onCancel={() => {
				setIsAddTagPopupOpened(false);

			}} />}
		</>
	);
};
