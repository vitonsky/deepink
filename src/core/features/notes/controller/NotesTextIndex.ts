import { Id, Index } from 'flexsearch';
import { IFilesStorage } from '@core/features/files';

export class NotesTextIndex {
	constructor(private readonly storage: IFilesStorage) {}

	private index: Promise<Index> | null = null;
	private getIndex() {
		if (!this.index) {
			this.index = this.storage.list().then(async (files) => {
				const index = new Index({ tokenize: 'tolerant' });

				await Promise.all(
					files.map(async (file) => {
						const data = await this.storage.get(file);

						const key = file
							.split('/')
							.find((segment) => segment.trim().length > 0);
						if (key && data) {
							await index.import(key, new TextDecoder().decode(data));
						}
					}),
				);

				return index;
			});
		}

		return this.index;
	}

	private async commit() {
		const index = await this.getIndex();
		await index.export(async (key, data) => {
			return this.storage.write('/' + key, new TextEncoder().encode(data).buffer);
		});
	}

	public async createIndexSession() {
		const index = await this.getIndex();

		return {
			async add(id: Id, content: string) {
				await index.addAsync(id, content);
			},
			async update(id: Id, content: string) {
				await index.updateAsync(id, content);
			},
			async remove(id: Id) {
				await index.removeAsync(id);
			},
			commit: async () => {
				// TODO: await all async ops
				await this.commit();
			},
		};
	}

	public async query(search: string) {
		const index = await this.getIndex();

		const results = await index.searchAsync(search);
		return results as string[];
	}
}
