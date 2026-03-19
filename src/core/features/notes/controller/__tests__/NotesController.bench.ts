import { getLongText } from 'src/__tests__/samples';
import { getUUID } from 'src/__tests__/utils/uuid';
import { bench } from 'vitest';
import z from 'zod';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { StateFile } from '@core/features/files/StateFile';
import { openSQLite } from '@core/storage/database/sqlite/openSQLite';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { FlexSearchIndex } from '../../../index/flexsearch/FlexSearchIndex';

import { NotesController } from '../NotesController';
import { NotesTextIndexer } from '../NotesTextIndexer';

function getRandomNumber(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FAKE_WORKSPACE_ID = getUUID();

const textSample = getLongText();

const benchConfig = {
	iterations: 1,
	time: 0,
	warmupIterations: 0,
	warmupTime: 0,
};

describe.sequential('Note ops performance', async () => {
	const dbFile = createFileControllerMock();
	const db = await openSQLite(dbFile);

	const index = new FlexSearchIndex(new InMemoryFS());
	const notes = new NotesController(db, FAKE_WORKSPACE_ID, index);
	const indexScanner = new NotesTextIndexer(
		notes,
		index,
		new StateFile(
			createFileControllerMock(),
			z.object({ lastUpdate: z.number().nullable() }),
		),
	);

	let noteCounter = 0;
	const getNoteId = () => ++noteCounter;

	describe('Note creation', () => {
		bench(
			'Add note with 10k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 10_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);

		bench(
			'Add note with 50k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 50_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);

		bench(
			'Add note with 90k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 90_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);
	});

	describe('Updates', () => {
		let noteIds: string[];
		bench(
			'Update random notes with 300 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 300),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);

		bench(
			'Update random notes with 10_000 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 10_000),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);

		bench(
			'Update random notes with 80_000 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 80_000),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);
	});

	describe('Note search', () => {
		bench(
			'Search note with random text',
			async function () {
				await indexScanner.update();
				await notes.get({
					// Text with typo
					search: { text: `powr` },
					limit: 10,
				});
			},
			{
				...benchConfig,
				iterations: 10,
			},
		);
	});
});
