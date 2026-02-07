import { NotesController } from '../notes/controller/NotesController';

// TODO: add tests with restore from bin and different time zones
/**
 * Permanently deletes a notes moved to bin out of retention time policy
 */
export class TrashCleaner {
	constructor(
		private readonly controllers: {
			notes: NotesController;
		},
		private readonly config: {
			retentionTime: number;
			considerModificationTime?: boolean;
		},
	) {}

	public async empty() {
		const { notes } = this.controllers;

		// TODO: use `query` method to fetch only ids
		const noteIds = await notes
			.get({ meta: { isDeleted: true } })
			.then((notes) => notes.map((note) => note.id));

		await notes.delete(noteIds);

		return noteIds.length;
	}

	public async purgeExpired() {
		const { notes } = this.controllers;
		const { retentionTime, considerModificationTime } = this.config;

		// TODO: use `query` method to fetch only ids
		const validityDate = Date.now() - retentionTime;
		const noteIds = await notes
			.get({
				deletedAt: {
					to: new Date(validityDate),
				},
			})
			.then((notes) =>
				notes
					.values()
					.filter((note) => {
						if (
							considerModificationTime &&
							note.updatedTimestamp !== undefined &&
							note.updatedTimestamp > validityDate
						)
							return false;
						return true;
					})
					.map((note) => note.id)
					.toArray(),
			);

		await notes.delete(noteIds);

		return noteIds.length;
	}
}
