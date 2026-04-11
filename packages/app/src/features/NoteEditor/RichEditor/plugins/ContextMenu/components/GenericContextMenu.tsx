import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { $isLinkNode } from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';

import { $isImageNode } from '../../Image/ImageNode';

import { ContextMenuRendererProps } from '../ContextMenuPlugin';
import { ObjectPropertiesEditor } from './ObjectPropertiesEditor';

export const GenericContextMenu: FC<ContextMenuRendererProps> = ({
	node,
	editor,
	close,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	return editor.read(() => {
		if ($isImageNode(node)) {
			return (
				<ObjectPropertiesEditor
					title={t('contextMenu.imageProperties.title')}
					onClose={close}
					options={[
						{
							id: 'url',
							value: node.getSrc(),
							label: t('contextMenu.imageProperties.urlLabel'),
						},
						{
							id: 'alt',
							value: node.getAltText() ?? '',
							label: t('contextMenu.imageProperties.altLabel'),
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
					title={t('contextMenu.linkProperties.title')}
					onClose={close}
					options={[
						{
							id: 'url',
							value: linkNode.getURL(),
							label: t('contextMenu.linkProperties.urlLabel'),
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
};
