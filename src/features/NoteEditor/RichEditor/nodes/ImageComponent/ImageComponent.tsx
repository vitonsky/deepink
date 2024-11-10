/* eslint-disable spellcheck/spell-checker */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
	$getSelection,
	$isNodeSelection,
	COMMAND_PRIORITY_LOW,
	createCommand,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	LexicalCommand,
	NodeKey,
} from 'lexical';
import {
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	Portal,
} from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

import { $isImageNode } from '../ImageNode';
import { ImagePropertiesPicker } from './ImagePropertiesPicker';

const imageCache = new Set();

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
	'RIGHT_CLICK_IMAGE_COMMAND',
);
export const LEFT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
	'LEFT_CLICK_IMAGE_COMMAND',
);

function useSuspenseImage(src: string) {
	if (!imageCache.has(src)) {
		throw new Promise((resolve) => {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				imageCache.add(src);
				resolve(null);
			};
			img.onerror = () => {
				imageCache.add(src);
			};
		});
	}
}

export const LazyImage = React.forwardRef<
	HTMLImageElement,
	{
		altText: string;
		className?: string | null;
		height: 'inherit' | number;
		maxWidth?: number;
		src: string;
		width: 'inherit' | number;
		onError: () => void;
	}
>(({ altText, className, src, width, height, maxWidth, onError }, ref): JSX.Element => {
	useSuspenseImage(src);

	return (
		<img
			ref={ref}
			className={className || undefined}
			src={src}
			alt={altText}
			style={{
				height,
				maxWidth,
				width,
				objectFit: 'contain',
			}}
			onError={onError}
			draggable="false"
		/>
	);
});

function BrokenImage(): JSX.Element {
	return <div>Broken image</div>;
}

export default function ImageComponent({
	src,
	altText,
	nodeKey,
	width,
	height,
	maxWidth,
}: {
	nodeKey: NodeKey;
	src: string;
	altText: string;
	width: 'inherit' | number;
	height: 'inherit' | number;
	maxWidth?: number;
}): JSX.Element {
	const containerRef = useRef<null | HTMLImageElement>(null);

	const [editor] = useLexicalComposerContext();
	const [isMenuOpened, setIsMenuOpened] = useState(false);
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

	const [isLoadError, setIsLoadError] = useState<boolean>(false);
	useEffect(() => {
		setIsLoadError(false);
	}, [src]);

	const $onDelete = useCallback(
		(payload: KeyboardEvent) => {
			const deleteSelection = $getSelection();
			if (isSelected && $isNodeSelection(deleteSelection)) {
				const event: KeyboardEvent = payload;
				event.preventDefault();
				editor.update(() => {
					deleteSelection.getNodes().forEach((node) => {
						if ($isImageNode(node)) {
							node.remove();
						}
					});
				});
			}
			return false;
		},
		[editor, isSelected],
	);

	const onContextMenu = useCallback((payload: MouseEvent) => {
		const event = payload;

		if (
			containerRef.current &&
			event.target instanceof Node &&
			containerRef.current.contains(event.target)
		) {
			setIsMenuOpened(true);
			return true;
		}

		return false;
	}, []);

	const onImageClick = useCallback((payload: MouseEvent) => {
		const event = payload;

		if (
			containerRef.current &&
			event.target instanceof Node &&
			containerRef.current.contains(event.target)
		) {
			containerRef.current.requestFullscreen();
			return true;
		}

		return false;
	}, []);

	useEffect(() => {
		const unregister = mergeRegister(
			editor.registerCommand<MouseEvent>(
				RIGHT_CLICK_IMAGE_COMMAND,
				onContextMenu,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<MouseEvent>(
				LEFT_CLICK_IMAGE_COMMAND,
				onImageClick,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				$onDelete,
				COMMAND_PRIORITY_LOW,
			),
		);

		return () => {
			unregister();
		};
	}, [
		clearSelection,
		editor,
		isSelected,
		nodeKey,
		$onDelete,
		setSelected,
		onContextMenu,
		onImageClick,
	]);

	return (
		<Popover
			isOpen={isMenuOpened}
			placement="bottom"
			closeOnBlur
			closeOnEsc
			onClose={() => setIsMenuOpened(false)}
			returnFocusOnClose={false}
		>
			<PopoverTrigger>
				<div
					ref={containerRef}
					draggable={false}
					onContextMenu={(event) => {
						editor.getEditorState().read(() => {
							editor.dispatchCommand(
								RIGHT_CLICK_IMAGE_COMMAND,
								event.nativeEvent as MouseEvent,
							);
						});
					}}
					onClick={(event) => {
						if (!(event.target instanceof HTMLImageElement)) return;
						if (event.button !== 0) return;

						editor.getEditorState().read(() => {
							editor.dispatchCommand(
								LEFT_CLICK_IMAGE_COMMAND,
								event.nativeEvent as MouseEvent,
							);
						});
					}}
				>
					<Suspense fallback={<div>Loading...</div>}>
						{isLoadError ? (
							<BrokenImage />
						) : (
							<LazyImage
								src={src}
								altText={altText}
								width={width}
								height={height}
								maxWidth={maxWidth}
								onError={() => setIsLoadError(true)}
							/>
						)}
					</Suspense>
				</div>
			</PopoverTrigger>
			<Portal>
				<PopoverContent>
					<PopoverArrow />
					<PopoverHeader>Image url</PopoverHeader>
					<PopoverCloseButton onClick={() => setIsMenuOpened(false)} />
					<PopoverBody>
						<ImagePropertiesPicker
							src={src}
							onUpdateUrl={(url) => {
								editor.update(() => {
									const imageNode = editor
										.getEditorState()
										._nodeMap.get(nodeKey);
									if (!imageNode || !$isImageNode(imageNode)) return;

									imageNode.setSrc(url);
								});
							}}
						/>
					</PopoverBody>
				</PopoverContent>
			</Portal>
		</Popover>
	);
}
