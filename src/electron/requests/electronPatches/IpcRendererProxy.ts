import { IpcRendererEventHandler, IpcRendererProxyAPI } from './shared';

/**
 * When you pass function from a renderer to preload script, this function wraps via Electron proxy,
 * so if you twice pass the same function it will not be equal because of wrapper.
 *
 * This behavior block us to just expose an `ipcRenderer` methods to subscribe and unsubscribe,
 * since unsubscribe methods will receive wrapped listeners and will not unsubscribe anything.
 *
 * This class solve a problem via assign an id to a wrapped function, and let unsubscribe by id.
 */
export class IpcRendererProxy implements IpcRendererProxyAPI {
	// TODO: add options to control the allowed and blocked channels for better security
	constructor(private readonly ipcRenderer: Pick<Electron.IpcRenderer, 'on' | 'off'>) {}

	private counter = 0;
	private getId() {
		return ++this.counter;
	}

	private readonly listeners: Record<number, IpcRendererEventHandler> = {};
	public on(channel: string, listener: IpcRendererEventHandler): number {
		const id = this.getId();
		this.listeners[id] = listener;

		this.ipcRenderer.on(channel, listener);
		return id;
	}

	public off(channel: string, listenerId: number) {
		const listener = this.listeners[listenerId];
		if (!listener) return;

		this.ipcRenderer.off(channel, listener);
		delete this.listeners[listenerId];
	}
}
