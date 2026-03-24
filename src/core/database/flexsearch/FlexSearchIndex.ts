import { proxy, Remote, wrap } from 'comlink';
import { noop } from 'lodash';
import { IFilesStorage } from '@core/features/files';
import { ComlinkHostFS } from '@core/features/files/ComlinkFS';

import { IndexWorkerApi } from '.';

export class FlexSearchIndex {
	constructor(private readonly storage: IFilesStorage) {}

	private state: Promise<{
		index: Remote<IndexWorkerApi>;
		worker: Worker;
		abortController: AbortController;
		onAbortPromise: Promise<void>;
	}> | null = null;
	private getState() {
		if (!this.state) {
			const worker = new Worker(
				/* webpackChunkName: "FlexSearchIndex.worker" */ new URL(
					'./FlexSearchIndex.worker',
					import.meta.url,
				),
				{ type: 'module' },
			);
			this.state = Promise.resolve().then(async () => {
				const index = wrap<IndexWorkerApi>(worker);
				const fs = proxy(new ComlinkHostFS(this.storage));

				await index.init({ tokenize: 'tolerant' }, fs);

				const abortController = new AbortController();

				const onAbortPromise = new Promise<void>((_, reject) => {
					abortController.signal.addEventListener('abort', () => {
						reject(abortController.signal.reason);
					});
				});
				// Prevent "Uncaught error" messages
				onAbortPromise.catch(noop);

				return {
					index,
					worker,
					abortController,
					onAbortPromise,
				};
			});
		}

		return this.state;
	}

	public async load() {
		await this.getState();
	}

	public async unload() {
		if (!this.state) return;

		const { worker, abortController } = await this.state;
		abortController.abort(new Error('Worker is unloaded'));
		worker.terminate();
		this.state = null;
	}

	private async commit() {
		const { index } = await this.getState();
		await index.commit();
	}

	public async createIndexSession() {
		const { index, onAbortPromise } = await this.getState();

		const inFlight = new Set<Promise<void>>();
		const waitThePromise = (promise: Promise<void>) => {
			inFlight.add(promise);
			promise.finally(() => {
				inFlight.delete(promise);
			});

			return Promise.race([onAbortPromise, promise]);
		};

		return {
			async add(id: string, content: string) {
				await waitThePromise(index.add(id, content));
			},
			async update(id: string, content: string) {
				await waitThePromise(index.update(id, content));
			},
			async remove(id: string) {
				await waitThePromise(index.remove(id));
			},
			commit: async () => {
				await Promise.all(inFlight);
				await Promise.race([onAbortPromise, this.commit()]);
			},
		};
	}

	public async query(search: string) {
		const { index } = await this.getState();
		return index.search(search);
	}
}
