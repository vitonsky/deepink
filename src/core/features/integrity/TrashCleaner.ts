import { NotesController } from '../notes/controller/NotesController';

export class TrashCleaner {
	constructor(
		private readonly controllers: {
			notes: NotesController;
		},
		private readonly config: {
			retentionTime: number;
		},
	) {}

	public async purgeExpired() {
		const { notes } = this.controllers;
		const { retentionTime } = this.config;

		const noteIds = await notes
			.get({
				deletedAt: {
					to: new Date(Date.now() - retentionTime),
				},
			})
			.then((notes) => notes.map((note) => note.id));

		await notes.delete(noteIds);

		return noteIds.length;
	}
}
