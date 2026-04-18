import { webcrypto } from 'node:crypto';

import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { RootedFS } from '@core/features/files/RootedFS';

import { VaultsManager } from './VaultsManager';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

const UUID_PATTERN = /^[\da-f-]{36}$/i;

test('Vault may be created', async () => {
	const files = createFileManagerMock();
	const vaults = new VaultsManager(files, (name) => new RootedFS(files, name));

	await expect(files.list(), 'No files').resolves.toEqual([]);
	await expect(vaults.getVaults(), 'No vaults').resolves.toEqual([]);

	// Add few vaults
	await expect(
		vaults.add({
			name: 'foo',
			encryption: null,
		}),
	).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'foo',
		encryption: null,
	});

	await expect(
		vaults.add({
			name: 'bar',
			encryption: null,
		}),
	).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'bar',
		encryption: null,
	});

	await expect(vaults.getVaults(), 'All vaults is in list').resolves.toEqual([
		{
			id: expect.stringMatching(UUID_PATTERN),
			name: 'foo',
			encryption: null,
		},
		{
			id: expect.stringMatching(UUID_PATTERN),
			name: 'bar',
			encryption: null,
		},
	]);

	await expect(files.list(), 'Only vaults list is created').resolves.toEqual([
		'/vaults.json',
	]);
});

test('Vault with encryption writes a key into file', async () => {
	const files = createFileManagerMock();
	const vaults = new VaultsManager(files, (name) => new RootedFS(files, '/' + name));

	await expect(files.list(), 'No files').resolves.toEqual([]);
	await expect(vaults.getVaults(), 'No vaults').resolves.toEqual([]);

	// Add vault with encryption
	const key = new Uint8Array(100).buffer;
	await expect(
		vaults.add({
			name: 'foo',
			encryption: {
				algorithm: 'test',
				salt: 'salt',
				key: key,
			},
		}),
	).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'foo',
		encryption: {
			algorithm: 'test',
			salt: 'salt',
			key: key,
		},
	});

	await expect(
		files.list(),
		'Vaults file and vault dir with key is created',
	).resolves.toEqual(['/vaults.json', expect.stringMatching(/^\/[\da-f-]{36}\/key$/i)]);

	const vault = await vaults.getVaults().then((vaults) => vaults[0]);
	expect(
		files.get(`/${vault.id}/key`),
		'Key file contains an exact buffer',
	).resolves.toStrictEqual(key);

	await expect(vaults.get(vault.id)).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'foo',
		// FIXME: vault manager should only list vaults, not its encryption settings. See #215
		encryption: {
			algorithm: 'test',
			salt: 'salt',
			key: {},
		},
	});
});
