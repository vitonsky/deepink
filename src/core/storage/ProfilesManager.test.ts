import { ProfilesManager } from './ProfilesManager';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { RootedFS } from '@core/features/files/RootedFS';
import { webcrypto } from 'node:crypto';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

const UUID_PATTERN = /^[\da-f-]{36}$/i;

test('Profiles may be created', async () => {
	const files = createFileManagerMock();
	const profiles = new ProfilesManager(
		files,
		(profileName) => new RootedFS(files, profileName),
	);

	await expect(files.list(), 'No files').resolves.toEqual([]);
	await expect(profiles.getProfiles(), 'No profiles').resolves.toEqual([]);

	// Add few profiles
	await expect(
		profiles.add({
			name: 'foo',
			encryption: null,
		}),
	).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'foo',
		encryption: null,
	});

	await expect(
		profiles.add({
			name: 'bar',
			encryption: null,
		}),
	).resolves.toEqual({
		id: expect.stringMatching(UUID_PATTERN),
		name: 'bar',
		encryption: null,
	});

	await expect(profiles.getProfiles(), 'All profiles is in list').resolves.toEqual([
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

	await expect(files.list(), 'Only profiles list is created').resolves.toEqual([
		'/profiles.json',
	]);
});

test('Profile with encryption writes a key into file', async () => {
	const files = createFileManagerMock();
	const profiles = new ProfilesManager(
		files,
		(profileName) => new RootedFS(files, '/' + profileName),
	);

	await expect(files.list(), 'No files').resolves.toEqual([]);
	await expect(profiles.getProfiles(), 'No profiles').resolves.toEqual([]);

	// Add profile with encryption
	const key = new Uint8Array(100).buffer;
	await expect(
		profiles.add({
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
		'Profiles file and profile dir with key is created',
	).resolves.toEqual([
		'/profiles.json',
		expect.stringMatching(/^\/[\da-f-]{36}\/key$/i),
	]);

	const profile = await profiles.getProfiles().then((profiles) => profiles[0]);
	expect(
		files.get(`/${profile.id}/key`),
		'Key file contains an exact buffer',
	).resolves.toStrictEqual(key);

	await expect(profiles.get(profile.id)).resolves.toEqual({
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
