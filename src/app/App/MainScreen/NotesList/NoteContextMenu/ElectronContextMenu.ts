import { createEvent, Event } from 'effector';

import { ContextMenu } from '../../../../../electron/contextMenu';
import { openContextMenu } from '../../../../../electron/contextMenu/renderer';
import { isDictionaryValue } from '../../../../../utils/validation';

import { NoteActions } from '.';

type VoidCallback = () => void;

// TODO: implement handle `onClick` events for menu items
export class ElectronContextMenu {
	private menu: ContextMenu;
	private onClosed: Event<void>;
	private onClicked: Event<NoteActions>;
	constructor(menu: ContextMenu) {
		this.menu = menu;
		this.onClosed = createEvent();
		this.onClicked = createEvent();
	}

	public open({ x, y }: { x: number; y: number }) {
		openContextMenu({
			menu: this.menu,
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
