import { Endpoint, expose, wrap } from 'comlink';
import { NodeEndpoint } from 'comlink/dist/umd/node-adapter.js';

export const exposeWorker = async (api: any) => {
	// Do not bind port in browser
	if (typeof process === 'undefined') return expose(api);

	const [{ default: nodeAdapter }, { parentPort }] = await Promise.all([
		import('comlink/dist/umd/node-adapter.js'),
		import('worker_threads'),
	]);

	const port = parentPort ? nodeAdapter(parentPort) : undefined;
	return expose(api, port);
};

export async function wrapWorker<T = unknown>(ep: Endpoint) {
	// Do not bind port in browser
	if (typeof process === 'undefined') return wrap<T>(ep);

	const [{ default: nodeAdapter }] = await Promise.all([
		import('comlink/dist/umd/node-adapter.js'),
	]);

	return wrap<T>(nodeAdapter(ep as unknown as NodeEndpoint));
}
