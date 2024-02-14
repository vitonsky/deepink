export interface ChannelOptions {
	readonly name: string;
}

export type ApiToMappers<T extends Record<string, (...args: any[]) => Promise<any>>> = {
	[K in keyof T]: (
		rsp: T[K] extends Promise<infer R> ? R : never,
		args: Parameters<T[K]>,
	) => ReturnType<T[K]>;
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

export type ServerRequestHandler<Context = never> = (
	endpoint: string,
	callback: (parameters: { req: any; ctx: Context }) => any,
) => () => void;

export type ClientFetcher = (endpoint: string, args: any[]) => Promise<any>;

export const createChannel = <T extends Record<string, (...args: any[]) => Promise<any>>>(
	options: ChannelOptions,
) => {
	return {
		client: (fetcher: ClientFetcher, mappers: Partial<ApiToMappers<T>> = {}): T => {
			return new Proxy<T>({} as any, {
				get: function (_target, methodName: string) {
					const endpoint = [options.name, methodName].join('.');
					const mapper = mappers[methodName];
					return (...args: Parameters<T[keyof T]>) =>
						fetcher(endpoint, args).then((response) =>
							mapper ? mapper(response, args) : response,
						);
				},
			});
		},
		server: <Context = never>(
			requestsHandler: ServerRequestHandler<Context>,
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
