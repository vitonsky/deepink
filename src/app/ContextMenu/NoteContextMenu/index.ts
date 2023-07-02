import { createEvent, Event } from 'effector';

import { openContextMenu } from '../../../electron/contextMenu/renderer';

export const noteMenuId = 'note';

export enum NoteActions {
	DUPLICATE = 'duplicate',
	DELETE = 'delete',
}

type VoidCallback = () => void;

const isDictionaryValue = <T extends Record<any, any>>(
	dictionary: T,
	value: unknown,
): value is T[keyof T] => Object.values(dictionary).includes(value);

export class ElectronContextMenu {
	private menuId: string;
	private onClosed: Event<void>;
	private onClicked: Event<NoteActions>;
	constructor(menuId: string) {
		this.menuId = menuId;

		this.onClosed = createEvent();
		this.onClicked = createEvent();
	}

	public open({ x, y }: { x: number; y: number }) {
		openContextMenu({
			menuId: this.menuId,
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