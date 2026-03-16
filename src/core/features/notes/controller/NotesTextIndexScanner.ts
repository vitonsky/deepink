import { NotesTextIndex } from './NotesTextIndex';
import { INotesController } from '.';

export class NotesTextIndexScanner {
	constructor(
		private readonly notes: INotesController,
		private readonly index: NotesTextIndex,
	) {}

	public async update() {
		const index = await this.index.createIndexSession();

		// TODO: iterate notes based on time
		const notes = await this.notes.get();
		await Promise.all(
			notes.map((note) =>
				index.add(note.id, note.content.title + ' ' + note.content.text),
			),
		);
		await index.commit();

		return notes.length;
	}
}
