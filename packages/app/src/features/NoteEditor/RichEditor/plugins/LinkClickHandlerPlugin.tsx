import { useEffect } from 'react';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { useUrlOpener } from '@hooks/useUrlOpener';
import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent } from '@lexical/utils';

export const LinkClickHandlerPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const openUrl = useUrlOpener();

	useEffect(() => {
		const rootElement = editor.getRootElement();
		if (!rootElement) return;

		const onClick = async (evt: MouseEvent) => {
			const target = evt.target;
			if (!(target instanceof HTMLElement)) return;

			const url = editor.read(() => {
				const node = $getNearestNodeFromDOMNode(target);
				if (!node) return null;

				const linkNode = $isLinkNode(node)
					? node
					: $findMatchingParent(node, $isLinkNode);
				if (!linkNode) return null;

				return linkNode.getURL();
			});

			if (!url) return;

			evt.preventDefault();
			evt.stopPropagation();
			evt.stopImmediatePropagation();

			await openUrl(url);
		};

		window.addEventListener('click', onClick, { capture: true });
		return () => {
			window.removeEventListener('click', onClick, { capture: true });
		};
	}, [editor, openUrl]);

	return null;
};
