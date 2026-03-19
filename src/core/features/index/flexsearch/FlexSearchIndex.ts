import { proxy, Remote } from 'comlink';
import { IFilesStorage } from '@core/features/files';
import { ComlinkHostFS } from '@core/features/files/ComlinkFS';
import { wrapWorker } from '@utils/workers/comlink';

import IndexWorker from './Index.worker';
import { IndexWorkerApi } from '.';

export class FlexSearchIndex {
	constructor(private readonly storage: IFilesStorage) {
		this.getIndex();
	}

	private index: Promise<Remote<IndexWorkerApi>> | null = null;
	private getIndex() {
		if (!this.index) {
			this.index = wrapWorker<IndexWorkerApi>(new IndexWorker()).then(
				async (index) => {
					const fs = proxy(new ComlinkHostFS(this.storage));

					await index.init({ tokenize: 'tolerant' }, fs);

					return index;
				},
			);
		}

		return this.index;
	}

	private async commit() {
		const index = await this.getIndex();
		await index.commit();
	}

	public async createIndexSession() {
		const index = await this.getIndex();

		return {
			async add(id: string, content: string) {
				await index.add(id, content);
			},
			async update(id: string, content: string) {
				await index.update(id, content);
			},
			async remove(id: string) {
				await index.remove(id);
			},
			commit: async () => {
				// TODO: await all async ops
				await this.commit();
			},
		};
	}

	public async query(search: string) {
		const index = await this.getIndex();
		return index.search(search);
	}
}
