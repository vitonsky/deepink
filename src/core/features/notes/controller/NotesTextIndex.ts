import { Id, Index } from 'flexsearch';

export class NotesTextIndex {
	constructor(private readonly index: Index) {}

	public async createIndexSession() {
		const index = this.index;

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
			async commit() {
				// TODO: await all async ops
				// await index.commit();
			},
		};
	}

	public async query(search: string) {
		const results = await this.index.searchAsync(search);
		return results as string[];
	}
}
