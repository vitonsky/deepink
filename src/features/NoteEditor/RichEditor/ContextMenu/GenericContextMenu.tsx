/* eslint-disable spellcheck/spell-checker */
import React, { FC } from 'react';
import { $isLinkNode } from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';

import { $isImageNode } from '../nodes/ImageNode';
import { ContextMenuRendererProps } from './ContextMenu';
import { ObjectPropertiesEditor } from './ObjectPropertiesEditor';

export const GenericContextMenu: FC<ContextMenuRendererProps> = ({
	node,
	editor,
	close,
}) =>
	editor.read(() => {
		if ($isImageNode(node)) {
			return (
				<ObjectPropertiesEditor
					title="Image properties"
					onClose={close}
					options={[
						{
							id: 'url',
							value: node.getSrc(),
							label: 'Image url',
						},
						{
							id: 'alt',
							value: node.getAltText() ?? '',
							label: 'Image alt text',
						},
					]}
					onUpdate={(update) => {
						const { url, alt } = update;
						editor.update(() => {
							node.setSrc(url);
							node.setAltText(alt);
						});
						close();
					}}
				/>
			);
		}

		const linkNode = $isLinkNode(node)
			? node
			: $findMatchingParent(node, (node) => $isLinkNode(node));
		if ($isLinkNode(linkNode)) {
			return (
				<ObjectPropertiesEditor
					title="Link properties"
					onClose={close}
					options={[
						{
							id: 'url',
							value: linkNode.getURL(),
							label: 'Link url',
						},
					]}
					onUpdate={({ url, alt }) => {
						editor.update(() => {
							linkNode.setURL(url);
							linkNode.setTitle(alt);
						});
						close();
					}}
				/>
			);
		}

		return null;
	});
