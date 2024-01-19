import { ReactNode } from 'react';

export type ButtonObject = {
	visible: boolean;
	onClick?: () => void;
	title?: string;
} & (
	| {
			icon: ReactNode;
			text?: string;
	  }
	| {
			icon?: ReactNode;
			text: string;
	  }
);

export type ManagedButton = {
	id: string;
	button: ButtonObject;
};

export type ManagedButtons = { start: ManagedButton[]; end: ManagedButton[] };

export type Placement = 'start' | 'end';

export class ButtonsManager {
	private updateCallback: (state: ManagedButtons) => void;
	constructor(updateCallback: (state: ManagedButtons) => void) {
		this.updateCallback = updateCallback;
	}

	private readonly buttons: { start: ManagedButton[]; end: ManagedButton[] } = {
		start: [],
		end: [],
	};

	private deleteIfExists(id: string) {
		for (const sideName in this.buttons) {
			this.buttons[sideName as Placement] = this.buttons[
				sideName as Placement
			].filter((button) => button.id !== id);
		}
	}

	private updateState() {
		this.updateCallback(this.buttons);
	}

	public get() {
		return this.buttons;
	}

	public register(id: string, button: ButtonObject, placement: 'start' | 'end') {
		this.deleteIfExists(id);
		this.buttons[placement].push({
			id,
			button,
		});

		this.updateState();
	}

	public unregister(id: string) {
		this.deleteIfExists(id);
		this.updateState();
	}

	public update(id: string, button: ButtonObject) {
		// Find button
		let existsButton: [Placement, number] | null = null;
		for (const sideName in this.buttons) {
			const buttonIndex = this.buttons[sideName as Placement].findIndex(
				(button) => button.id === id,
			);
			if (buttonIndex !== -1) {
				existsButton = [sideName as Placement, buttonIndex];
				break;
			}
		}

		if (existsButton === null) return;

		const [placement, index] = existsButton;
		this.buttons[placement][index] = {
			id,
			button,
		};

		this.updateState();
	}
}
