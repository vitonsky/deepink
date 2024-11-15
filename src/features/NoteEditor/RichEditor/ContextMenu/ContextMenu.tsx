/* eslint-disable spellcheck/spell-checker */
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { $getNearestNodeFromDOMNode, LexicalEditor, LexicalNode } from 'lexical';
import { Box, BoxProps, Portal } from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { flip, offset, preventOverflow } from '@popperjs/core';

export type ContextMenuProps = BoxProps & {
	onOpen: (props: {
		node: LexicalNode;
		element: Element;
		editor: LexicalEditor;
		close: () => void;
	}) => ReactNode;
};

export const ContextMenu = ({ onOpen, ...props }: ContextMenuProps) => {
	const [editor] = useLexicalComposerContext();

	const [menuContext, setMenuContext] = useState<{
		node: LexicalNode;
		element: Element;
	} | null>(null);

	const close = useCallback(() => {
		setMenuContext(null);
	}, []);

	// Trigger context menu
	const rootElement = editor.getRootElement();
	useEffect(() => {
		if (!rootElement) return;

		const onContextMenu = (evt: MouseEvent) => {
			editor.read(() => {
				const target = evt.target as HTMLElement;

				const lexicalNode = $getNearestNodeFromDOMNode(target);
				if (!lexicalNode) return;

				const rootElement = editor.getElementByKey(lexicalNode.getKey());
				if (!rootElement) return;

				setMenuContext({
					node: lexicalNode,
					element: rootElement,
				});
			});
		};

		rootElement.addEventListener('contextmenu', onContextMenu);
		return () => {
			rootElement.removeEventListener('contextmenu', onContextMenu);
		};
	}, [editor, rootElement, setMenuContext]);

	// Maintain context data
	useEffect(() => {
		if (!menuContext) return;

		const currentNode = menuContext.node;
		const currentElement = menuContext.element;
		return mergeRegister(
			// Close context menu by remove node from tree
			editor.registerUpdateListener(() => {
				const isAttached = editor.read(() => currentNode.isAttached());
				if (!isAttached) {
					close();
				}
			}),
			// Update DOM element in current context, bu changes in Lexical node
			editor.registerUpdateListener((_node) => {
				const newElement = editor.getElementByKey(menuContext.node.getKey());
				if (!newElement) {
					close();
					return;
				}

				if (newElement === currentElement) return;

				setMenuContext({
					...menuContext,
					element: newElement,
				});
			}),
		);
	}, [close, editor, menuContext]);

	// Manage popper
	const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
	const popper = usePopper(menuContext?.element, popperRef, {
		placement: 'top',
		modifiers: [
			{ ...flip, options: { fallbackPlacements: ['bottom', 'top'] } },
			{ ...offset, options: { offset: [0, 10] } },
			{
				...preventOverflow,
				options: {
					mainAxis: true,
					altAxis: true,
					boundary: 'clippingParents',
					padding: 10,
				},
			} as const,
		],
	});

	// Fix popup position
	useEffect(() => {
		return editor.registerUpdateListener(() => {
			popper?.forceUpdate?.();
		});
	}, [editor, popper]);

	// Close popup by click outside
	useEffect(() => {
		if (!popperRef) return;

		const onMouseDown = (evt: MouseEvent) => {
			const target = evt.target;
			if (!(target instanceof HTMLElement)) return;

			if (target !== popperRef && !popperRef.contains(target)) {
				close();
			}
		};

		document.addEventListener('mousedown', onMouseDown);
		return () => {
			document.removeEventListener('mousedown', onMouseDown);
		};
	}, [close, popperRef, setMenuContext]);

	const children = menuContext ? onOpen({ ...menuContext, editor, close }) : null;

	return children ? (
		<Portal>
			<Box
				ref={setPopperRef}
				tabIndex={0}
				{...props}
				style={{ ...popper.styles.popper, ...props.style }}
				onKeyUp={(evt) => {
					// Close by escape
					if (evt.key === 'Escape') {
						close();
					}
				}}
			>
				{children}
			</Box>
		</Portal>
	) : null;
};
