export interface ChannelOptions {
	readonly name: string;
}

export type ApiToFetchers<T extends Record<string, (...args: any[]) => Promise<any>>> = {
	[K in keyof T]: (parameters: {
		channelName: string;
		args: Parameters<T[K]>;
	}) => ReturnType<T[K]>;
};

export type ApiToHandlers<
	T extends Record<string, (...args: any[]) => Promise<any>>,
	Context = never,
> = {
	[K in keyof T]: (parameters: {
		req: Parameters<T[K]>;
		ctx: Context;
	}) => ReturnType<T[K]> extends Promise<infer R> ? Promise<R | undefined> : never;
};

export type ServerRequestHandler = (
	endpoint: string,
	callback: (parameters: { req: any; ctx: any }) => any,
) => () => void;

export const createChannel = <T extends Record<string, (...args: any[]) => Promise<any>>>(
	options: ChannelOptions,
) => {
	return {
		// TODO: return proxy object that will forward calls to a fetcher with optional data mapping
		client: (fetchers: ApiToFetchers<T>): T => {
			return Object.fromEntries(
				Object.entries(fetchers).map(([methodName, callback]) => [
					methodName,
					(...args) =>
						callback({
							channelName: [options.name, methodName].join('.'),
							args,
						}),
				]),
			) as T;
		},
		// TODO: bind context type from `requestsHandler`
		server: <Context = never>(
			requestsHandler: ServerRequestHandler,
			callbacks: ApiToHandlers<T, Context>,
		): (() => void) => {
			const cleanups = Object.entries(callbacks).map(([methodName, callback]) =>
				requestsHandler([options.name, methodName].join('.'), callback),
			);
			return () => {
				cleanups.forEach((cleanup) => cleanup());
			};
		},
	};
};
