import { getNoteTitle } from '../app/App';

export type INote = {
	title?: string;
	text: string;
	date?: number;
};

export type IEditableNote = {
	id: string;
	title: string;
	text: string;
};

const delay = (time: number) => new Promise((res) => setTimeout(res, time));
export class NotesRegistry {
	private notes: { id: string; note: INote }[] = [];

	public async getNotes(): Promise<IEditableNote[]> {
		await delay(500);
		return this.notes.map((note) => ({
			id: note.id,
			title: getNoteTitle(note.note),
			...note.note,
		}));
	}

	private uidCounter = 0;
	public async addNote(note: INote) {
		await delay(30);
		const id = ++this.uidCounter + '_note';

		this.notes.push({ id, note });

		return id;
	}

	public async updateNote(updatedNote: IEditableNote) {
		await delay(100);

		const note = this.notes.find((note) => note.id === updatedNote.id);
		if (!note) return;

		const { id, ...updatedData } = updatedNote;
		Object.assign(note.note, updatedData);
	}
}

export const notesRegistry = new NotesRegistry();
