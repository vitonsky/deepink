/* eslint-disable spellcheck/spell-checker */
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { $getNearestNodeFromDOMNode, LexicalEditor, LexicalNode } from 'lexical';
import { Box, BoxProps, Portal } from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

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

	const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);

	const [menuContext, setMenuContext] = useState<{
		node: LexicalNode;
		element: Element;
	} | null>(null);
	const popper = usePopper(menuContext?.element, popperRef);

	const close = useCallback(() => {
		setMenuContext(null);
	}, []);

	// Fix popup position
	useEffect(() => {
		if (!popper.forceUpdate) return;

		return editor.registerUpdateListener(() => {
			if (!popper.forceUpdate) return;
			popper.forceUpdate();
		});
	}, [editor, menuContext, popper]);

	useEffect(() => {
		if (!menuContext) return;

		return editor.registerUpdateListener((node) => {
			const newElement = editor.getElementByKey(menuContext.node.getKey());
			if (!newElement) return;
			if (newElement === menuContext.element) return;

			console.log('UPDATE!!! AND FOUND A CHANGE');

			setMenuContext({
				...menuContext,
				element: newElement,
			});
		});
	}, [editor, menuContext]);

	useEffect(() => {
		if (!menuContext) return;

		const activeNode = menuContext.node;

		// editor.registerMutationListener(activeNode, console.log);

		return editor.registerUpdateListener(() => {
			const isAttached = editor.read(() => activeNode.isAttached());
			if (!isAttached) {
				close();
			}
		});
	}, [close, editor, menuContext]);

	useEffect(() => {
		if (!popperRef) return;

		const onMouseDown = (evt: MouseEvent) => {
			const target = evt.target;

			if (!(target instanceof HTMLElement)) return;
			if (target === popperRef || popperRef.contains(target)) return;

			close();
		};

		document.addEventListener('mousedown', onMouseDown);
		return () => {
			document.removeEventListener('mousedown', onMouseDown);
		};
	}, [close, popperRef, setMenuContext]);

	const rootElement = editor.getRootElement();
	useEffect(() => {
		if (!rootElement) return;

		const onContextMenu = (evt: MouseEvent) => {
			console.log('Context menu on editor');

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

				console.log('Node in context', lexicalNode);
			});
		};

		rootElement.addEventListener('contextmenu', onContextMenu);
		return () => {
			rootElement.removeEventListener('contextmenu', onContextMenu);
		};
	}, [editor, rootElement, setMenuContext]);

	const children = menuContext ? onOpen({ ...menuContext, editor, close }) : null;

	return children ? (
		<Portal>
			<Box
				ref={setPopperRef}
				tabIndex={0}
				{...props}
				style={{ ...popper.styles.popper, ...props.style }}
				onKeyUp={(evt) => {
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
