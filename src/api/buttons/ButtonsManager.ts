import type { ReactNode } from 'react';

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
	priority?: number;
	button: ButtonObject;
};

export type ManagedButtons = { start: ManagedButton[]; end: ManagedButton[] };

export type Placement = 'start' | 'end';

export type ButtonOptions = {
	placement: Placement;
	priority?: number;
};

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
		const sortFn = (a: ManagedButton, b: ManagedButton) => {
			if (a.priority === b.priority) return 0;

			if (a.priority === undefined) return -1;
			if (b.priority === undefined) return 1;

			if (a.priority > b.priority) return 1;
			if (a.priority < b.priority) return -1;

			return 0;
		};

		this.buttons.start = [...this.buttons.start.sort(sortFn)];
		this.buttons.end = [...this.buttons.end.sort(sortFn)];

		this.updateCallback(this.buttons);
	}

	public get() {
		return this.buttons;
	}

	public register(
		id: string,
		button: ButtonObject,
		{ placement, priority }: ButtonOptions,
	) {
		this.deleteIfExists(id);
		this.buttons[placement].push({
			id,
			priority,
			button,
		});

		this.updateState();
	}

	public unregister(id: string) {
		this.deleteIfExists(id);
		this.updateState();
	}

	public update(id: string, button: ButtonObject, { priority }: ButtonOptions) {
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
			...this.buttons[placement][index],
			...(priority === undefined ? {} : { priority }),
			id,
			button,
		};

		this.updateState();
	}
}
