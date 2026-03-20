import { proxy, Remote, wrap } from 'comlink';
import { noop } from 'lodash';
import { IFilesStorage } from '@core/features/files';
import { ComlinkHostFS } from '@core/features/files/ComlinkFS';

import IndexWorker from './Index.worker?worker';
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
			const worker = new IndexWorker();
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

		return {
			async add(id: string, content: string) {
				await Promise.race([onAbortPromise, index.add(id, content)]);
			},
			async update(id: string, content: string) {
				await Promise.race([onAbortPromise, index.update(id, content)]);
			},
			async remove(id: string) {
				await Promise.race([onAbortPromise, index.remove(id)]);
			},
			commit: async () => {
				// TODO: await all async ops
				await Promise.race([onAbortPromise, this.commit()]);
			},
		};
	}

	public async query(search: string) {
		const { index } = await this.getState();
		return index.search(search);
	}
}
