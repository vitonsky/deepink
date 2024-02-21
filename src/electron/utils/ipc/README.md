Utility to bind fetchers and request handlers implementations into one protocol.

# Overview

When you manually manage request handlers and request senders, you responsible to ensure consistent endpoint names and correct types of parameters and returned values.

Example:

```ts
// Shared code
type CalcOptions =  { numbers: numbers[]; action: 'plus' | 'minus'; };

// Code for server
ipcMain.handle('/calc', (evt: Electron.IpcMainInvokeEvent, args: CalcOptions) => {
	return args.numbers.reduce((acc, number) => args.action === 'plus' ? acc + number : acc - number);
});

// Code for client
ipcRenderer.invoke('/calc', { numbers: [1,2,3], action: 'plus' }).then(console.log);
```

When you have a dozens and hundreds endpoints it is hard to manage such code will be consistent on client and server side.

To resolve a problem, you can use util:

```ts
// Shared code
type CalcOptions =  { numbers: numbers[]; action: 'plus' | 'minus'; };

const calcChannel = createChannel<{
	calc: (options: CalcOptions) => Promise<number>;
}>({ name: 'calc' });

// Code for server
calcChannel.server((
	endpoint,
	callback,
) => {
	const eventCallback = (evt: Electron.IpcMainInvokeEvent, args: any) => {
		return callback({ req: args, ctx: evt });
	};

	ipcMain.handle(endpoint, eventCallback);

	return () => {
		ipcMain.off(endpoint, eventCallback);
	};
}, {
	async calc({ req: args }) {
		return args.numbers.reduce((acc, number) => args.action === 'plus' ? acc + number : acc - number);
	}
});

// Code for client
const { calc } = calcChannel.client((endpoint: string, args: any[]) => ipcRenderer.invoke(endpoint, args));
calc({ numbers: [1,2,3], action: 'plus' }).then(console.log);
```

Here we create a channel with `calcChannel` and then implement channel contract on server side with call `calcChannel.server` and provide requests listener manager and callbacks with correct types. On client side we just provide fetcher implementation.

Channel will automatically generate an endpoint name based on channel name + method name.

On client side you may map data
```ts
// Code for client
const { calc } = calcChannel.client((endpoint: string, args: any[]) => ipcRenderer.invoke(endpoint, args), {
	async calc(args, sendRequest) {
		// Add numbers for a task and send request
		return sendRequest([...args, 100, 200, 300]);
	},
});
calc({ numbers: [1,2,3], action: 'plus' }).then(console.log);
```