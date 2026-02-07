import { NotesController } from '../controller/NotesController';

// TODO: add tests with restore from bin and different time zones

export class DeletedNotesController {
	constructor(
		private readonly controllers: {
			notes: NotesController;
		},
		private readonly config: {
			retentionTime: number;
			considerModificationTime?: boolean;
		},
	) {}

	/**
	 * Permanently deletes all notes marked as deleted
	 */
	public async empty() {
		const { notes } = this.controllers;

		// TODO: use `query` method to fetch only ids
		const noteIds = await notes
			.get({ meta: { isDeleted: true } })
			.then((notes) => notes.map((note) => note.id));

		await notes.delete(noteIds);

		return noteIds.length;
	}

	/**
	 * Permanently deletes a notes marked as deleted longer than allow a retention policy
	 */
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
