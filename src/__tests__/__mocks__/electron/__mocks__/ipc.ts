/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { EventEmitter } from 'events';

class MockIpcMain extends EventEmitter implements Electron.IpcMain {
	private readonly handlers = new Map<string, Function>();

	handle(channel: string, fn: Function) {
		this.handlers.set(channel, fn);
	}

	removeHandler(channel: string) {
		this.handlers.delete(channel);
	}

	// called internally by renderer.invoke
	async _invokeFromRenderer(channel: string, ...args: any[]) {
		const handler = this.handlers.get(channel);
		if (!handler) {
			throw new Error(`No handler registered for ${channel}`);
		}
		const event = {
			sender: this,
			reply: (ch: string, data: any) => {
				(this as any)._sendToRenderer(ch, data);
			},
		};
		return handler(event, ...args);
	}

	// called internally by renderer.send
	_emitFromRenderer(channel: string, ...args: any[]) {
		const event = {
			sender: this,
			reply: (ch: string, data: any) => {
				(this as any)._sendToRenderer(ch, data);
			},
		};
		this.emit(channel, event, ...args);
	}

	// bound externally
	_sendToRenderer: (channel: string, data: any) => void = () => {};

	handleOnce = vi.fn();
}

// Define a type that checks if `sendTo` exists on `IpcRenderer`
type SendToType = 'sendTo' extends keyof Electron.IpcRenderer
	? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		Electron.IpcRenderer['sendTo']
	: never;

class MockIpcRenderer extends EventEmitter implements Electron.IpcRenderer {
	constructor(private readonly main: MockIpcMain) {
		super();
	}

	send(channel: string, ...args: any[]) {
		this.main._emitFromRenderer(channel, ...args);
	}

	async invoke(channel: string, ...args: any[]) {
		return this.main._invokeFromRenderer(channel, ...args);
	}

	// called by ipcMain to reply
	_emitFromMain(channel: string, ...args: any[]) {
		this.emit(channel, {}, ...args);
	}

	sendSync = vi.fn().mockReturnValue(Promise.resolve(undefined));
	postMessage = vi.fn();
	sendToHost = vi.fn();
	sendTo: SendToType = vi.fn() as SendToType;
}

// bind them together
const ipcMain = new MockIpcMain();
const ipcRenderer = new MockIpcRenderer(ipcMain);
ipcMain._sendToRenderer = (channel, data) => {
	ipcRenderer._emitFromMain(channel, data);
};

// export these for your tests
export { ipcMain, ipcRenderer };
