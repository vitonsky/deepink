import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';

export enum TagContextMenu {
	ADD = 'add',
	EDIT = 'edit',
	DELETE = 'delete',
}

export type TagContextMenuCallbacks = {
	onAdd: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
};

export const useTagContextMenu = ({
	onAdd,
	onEdit,
	onDelete,
}: TagContextMenuCallbacks) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.menu, { keyPrefix: 'tag' });

	const noteContextMenuCallback: ContextMenuCallback<TagContextMenu> = useCallback(
		async ({ id, action }) => {
			const actionsMap = {
				[TagContextMenu.ADD]: onAdd,
				[TagContextMenu.EDIT]: onEdit,
				[TagContextMenu.DELETE]: onDelete,
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[onAdd, onEdit, onDelete],
	);

	return useContextMenu(
		useMemo(
			() => [
				{
					id: TagContextMenu.ADD,
					label: t('addNestedTag'),
				},
				{
					id: TagContextMenu.EDIT,
					label: t('edit'),
				},
				{ type: 'separator' },
				{
					id: TagContextMenu.DELETE,
					label: t('delete'),
				},
			],
			[t],
		),
		noteContextMenuCallback,
	);
};
