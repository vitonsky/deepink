import { ExtendedPGLite } from './ExtendedPGLite';

const db = new ExtendedPGLite();

test('Init database with seed data', async () => {
	await db.query(
		`CREATE TABLE test (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), text TEXT NOT NULL)`,
	);
	await db.query(`INSERT INTO test(text) VALUES ('Hello world')`);
});

test('Listen commands on database', async () => {
	const onCommand = vi.fn();
	db.on('command', onCommand, { once: true });

	await expect(db.query('SELECT * FROM test;')).resolves.toEqual(
		expect.objectContaining({
			rows: [
				{
					id: expect.any(String),
					text: 'Hello world',
				},
			],
		}),
	);

	expect(onCommand).toHaveBeenCalledTimes(1);
	expect(onCommand).toBeCalledWith({ command: 'SELECT * FROM test;' });
});

describe('Import/export data', () => {
	let data: any;
	test('Dump data', async () => {
		data = await db.dumpDataDir();
	});

	let db2: ExtendedPGLite;
	test('Load data to a new DB', async () => {
		db2 = new ExtendedPGLite({ loadDataDir: data });
		await db2.waitReady;
	});

	test('Run query against second DB', async () => {
		await expect(db2.query('SELECT * FROM test;')).resolves.toEqual(
			expect.objectContaining({
				rows: [
					{
						id: expect.any(String),
						text: 'Hello world',
					},
				],
			}),
		);
	});

	test('Run another query against second DB', async () => {
		await expect(db2.query('SELECT * FROM test;')).resolves.toEqual(
			expect.objectContaining({
				rows: [
					{
						id: expect.any(String),
						text: 'Hello world',
					},
				],
			}),
		);
	});
});
