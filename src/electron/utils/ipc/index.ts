export interface ChannelOptions {
	readonly name: string;
}

type ApiSchema = Record<string, (...args: any[]) => Promise<any>>;

export type ApiToMappers<T extends ApiSchema> = {
	[K in keyof T]: (
		rsp: T[K] extends Promise<infer R> ? R : never,
		args: Parameters<T[K]>,
	) => ReturnType<T[K]>;
};

export type ApiToHandlers<T extends ApiSchema, Context = never> = {
	[K in keyof T]: (parameters: {
		req: Parameters<T[K]>;
		ctx: Context;
	}) => ReturnType<T[K]> extends Promise<infer R> ? Promise<R | undefined> : never;
};

export type ClientFetcher = (endpoint: string, args: any[]) => Promise<any>;

export type ServerRequestHandler<Context = never> = (
	endpoint: string,
	callback: (parameters: { req: any; ctx: Context }) => any,
) => () => void;

export const createChannel = <T extends ApiSchema>(options: ChannelOptions) => {
	const getResolvedEndpointName = (methodName: string) =>
		[options.name, methodName].join('.');

	return {
		client: (fetcher: ClientFetcher, mappers: Partial<ApiToMappers<T>> = {}): T => {
			// Return proxy object with virtual callbacks
			return new Proxy<T>({} as any, {
				get: function (_target, methodName: string) {
					const mapper = mappers[methodName];
					return (...args: Parameters<T[keyof T]>) =>
						fetcher(getResolvedEndpointName(methodName), args).then(
							(response) => (mapper ? mapper(response, args) : response),
						);
				},
			});
		},
		server: <Context = never>(
			receiver: ServerRequestHandler<Context>,
			callbacks: ApiToHandlers<T, Context>,
		): (() => void) => {
			// Subscribe on channels
			const cleanups = Object.entries(callbacks).map(([methodName, callback]) =>
				receiver(getResolvedEndpointName(methodName), callback),
			);
			return () => {
				cleanups.forEach((cleanup) => cleanup());
			};
		},
	};
};
