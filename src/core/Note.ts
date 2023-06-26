export type INote = {
	title?: string;
	text: string;
	createdTimestamp?: number;
	updatedTimestamp?: number;
};

export type IEditableNote = {
	id: string;
	data: INote;
};

const delay = (time: number) => new Promise((res) => setTimeout(res, time));
export class NotesRegistry {
	private notes: IEditableNote[] = [];

	public async getNotes(): Promise<IEditableNote[]> {
		await delay(500);
		return structuredClone(this.notes);
	}

	private uidCounter = 0;
	public async addNote(note: INote) {
		await delay(30);
		const id = ++this.uidCounter + '_note';

		this.notes.push({ id, data: { ...note, createdTimestamp: (new Date()).getTime() } });

		return id;
	}

	public async updateNote(updatedNote: IEditableNote) {
		await delay(100);

		const note = this.notes.find((note) => note.id === updatedNote.id);
		if (!note) return;
		Object.assign(note.data, updatedNote.data, { updatedTimestamp: (new Date()).getTime() });
	}
}

export const notesRegistry = new NotesRegistry();
