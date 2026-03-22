import { AsyncState } from '@core/features/files/AsyncState';

import { FlexSearchIndex } from '../../../database/flexsearch/FlexSearchIndex';

import { INotesController } from '.';

/**
 * Build and maintain the notes text index
 */
export class NotesTextIndexer {
	constructor(
		private readonly notes: INotesController,
		private readonly index: FlexSearchIndex,
		private readonly state: AsyncState<{ lastUpdate: number | null }>,
	) {}

	// TODO: use UTC time everywhere. Currently we start from a time based on locale time zone
	public async update() {
		const index = await this.index.createIndexSession();

		const initState = await this.state.get();

		let notesProcessed = 0;
		let startDate: Date | null =
			initState && initState.lastUpdate ? new Date(initState.lastUpdate + 1) : null;

		while (true) {
			// Take notes chunk
			const notes = await this.notes.get({
				sort: { by: 'updatedAt', order: 'asc' },
				updatedAt: { from: startDate ?? undefined },
				limit: 1000,
			});

			if (notes.length === 0) break;

			// Update index
			await Promise.all(
				notes.map((note) =>
					index.add(note.id, note.content.title + ' ' + note.content.text),
				),
			);
			await index.commit();

			const note = notes.at(-1)!;
			const lastTimestamp =
				note.updatedTimestamp ?? note.createdTimestamp ?? Date.now();
			await this.state.set({ lastUpdate: lastTimestamp });

			startDate = new Date(lastTimestamp + 1);
			notesProcessed += notes.length;
		}

		return notesProcessed;
	}
}
