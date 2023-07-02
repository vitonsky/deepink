import { createEvent, Event } from 'effector';

import { ContextMenu } from '../../../electron/contextMenu';
import { openContextMenu } from '../../../electron/contextMenu/renderer';

export enum NoteActions {
	DUPLICATE = 'duplicate',
	DELETE = 'delete',
}

type VoidCallback = () => void;

const isDictionaryValue = <T extends Record<any, any>>(
	dictionary: T,
	value: unknown,
): value is T[keyof T] => Object.values(dictionary).includes(value);

export const noteMenu: ContextMenu = [
	// TODO: implement
	// {
	// 	id: 'copyMarkdownLink',
	// 	label: 'Copy Markdown link',
	// },
	{
		id: NoteActions.DUPLICATE,
		label: 'Duplicate',
	},
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

export class ElectronContextMenu {
	private onClosed: Event<void>;
	private onClicked: Event<NoteActions>;
	constructor() {
		this.onClosed = createEvent();
		this.onClicked = createEvent();
	}

	public open({ x, y }: { x: number; y: number }) {
		openContextMenu({
			menu: noteMenu,
			x,
			y,
		}).then((action) => {
			if (action === null) {
				this.onClosed();
			} else if (isDictionaryValue(NoteActions, action)) {
				this.onClicked(action);
			}
		});
	}

	public onClose(callback: VoidCallback) {
		return this.onClosed.watch(callback);
	}

	public onClick(callback: (action: NoteActions) => void) {
		return this.onClicked.watch(callback);
	}
}
