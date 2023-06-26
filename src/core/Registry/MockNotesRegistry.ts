import { INote, INoteData } from '../Note';

const delay = (time: number) => new Promise((res) => setTimeout(res, time));

/**
 * Fake registry for tests
 */
export class MockNotesRegistry {
	private notes: INote[] = [];

	/**
	 * The same as `addNote`, but sync. Only for debug purposes
	 */
	public _loadNote(note: INoteData) {
		const id = ++this.uidCounter + '_note';

		this.notes.push({
			id,
			createdTimestamp: new Date().getTime(),
			data: structuredClone(note),
		});

		return id;
	}

	public async getNotes(): Promise<INote[]> {
		await delay(500);
		return structuredClone(this.notes);
	}

	private uidCounter = 0;
	public async addNote(note: INoteData) {
		await delay(30);
		return this._loadNote(note);
	}

	public async updateNote(id: string, updatedNote: INoteData) {
		await delay(100);

		const note = this.notes.find((note) => note.id === id);
		if (!note) return;

		Object.assign(note.data, updatedNote);
		note.updatedTimestamp = new Date().getTime();
	}
}
