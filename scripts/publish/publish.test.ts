/* eslint-disable camelcase */
/* eslint-disable spellcheck/spell-checker */
import { vol } from 'memfs';
import path from 'path';

import packageInfo from '../../package.json';

import { parseArgs } from './args';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));

const FAKE_RELEASE_ID = 'v0.0.0';

process.env.GITHUB_REPOSITORY = 'ownerName/repoName';
process.env.GITHUB_TOKEN = 'FAKE_TOKEN';

const createRelease = vi.fn();
const getReleaseByTag = vi.fn(async ({ tag }) => ({ data: { id: tag } }));
const listReleaseAssets = vi.fn(async () => ({
	data: [],
}));
const uploadReleaseAsset = vi.fn(async () => {});

let Octokit: ReturnType<typeof vi.fn>;
beforeEach(async () => {
	vi.clearAllMocks();

	// doMock is not hoisted, so it can capture the spies above
	vi.doMock('@octokit/rest', () => {
		Octokit = vi.fn().mockImplementation((opts: Record<string, unknown>) => {
			(Octokit as any).__lastOptions = opts;
			return {
				repos: {
					createRelease,
					getReleaseByTag,
					listReleaseAssets,
					uploadReleaseAsset,
				},
			};
		});
		return { Octokit };
	});

	// Now import the module under test AFTER mocking
	// dynamic import ensures the module picks up the mocked Octokit
	// (and if it constructs Octokit at import time, it'll use the mock)
	await import('./main');
});

beforeAll(async () => {
	const fakeContent = new Uint8Array(
		await new Blob([new TextEncoder().encode('File content')], {
			type: 'plain/text',
		}).arrayBuffer(),
	);

	const addFile = (filename: string) => {
		vol.mkdirSync(path.dirname(filename), { recursive: true });
		vol.writeFileSync(filename, fakeContent);
	};

	addFile('/foo/bar/out/make/AppImage/x64/Deepink-0.0.1-x64.AppImage');
	addFile('/foo/bar/out/make/win/x64/Deepink-0.0.1-x64.msi');
	addFile('/foo/bar/out/make/ios/x64/Deepink-0.0.1-x64.dmg');
	addFile('/foo/bar/out/make/deb/x64/deepink_0.0.1_amd64.deb');
	addFile('/foo/bar/out/make/zip/linux/x64/Deepink-linux-x64-0.0.1.zip');

	addFile('/foo/bar/out/make/zip/linux/x64/Deepink-linux-x64-0.0.1.txt');
	addFile('/foo/bar/out/make/zip/linux/x64/Deepink-linux-x64-0.0.1.jpg');
});

test('Publish script uploads all found artifacts as a new release', async () => {
	const { default: main } = await import('./main');

	getReleaseByTag.mockImplementationOnce(async () => {
		throw { status: 404 };
	});
	createRelease.mockReturnValueOnce(
		Promise.resolve({
			data: { id: FAKE_RELEASE_ID },
		}),
	);
	await main({ dir: '/foo/bar', tag: FAKE_RELEASE_ID, overwrite: true });

	expect(Octokit).toBeCalledWith({ auth: 'FAKE_TOKEN' });
	[
		'deepink-linux-x64-0.0.1.zip',
		'deepink-0.0.0.deb',
		'Deepink-0.0.0.AppImage',
		'Deepink-0.0.0.msi',
		'Deepink-0.0.0.dmg',
	].forEach((artifactName) =>
		expect(uploadReleaseAsset).toBeCalledWith(
			expect.objectContaining({
				name: artifactName,
				owner: 'ownerName',
				repo: 'repoName',
				release_id: FAKE_RELEASE_ID,
			}),
		),
	);

	expect(uploadReleaseAsset).toBeCalledTimes(5);
});

test('Publish script uploads all found artifacts to an exists release with overriding', async () => {
	const { default: main } = await import('./main');

	getReleaseByTag.mockReturnValueOnce(
		Promise.resolve({
			data: { id: FAKE_RELEASE_ID },
		}),
	);
	await main({ dir: '/foo/bar', tag: FAKE_RELEASE_ID, overwrite: true });

	expect(Octokit).toBeCalledWith({ auth: 'FAKE_TOKEN' });
	expect(uploadReleaseAsset).toBeCalledWith(
		expect.objectContaining({
			name: 'deepink-0.0.0.deb',
			owner: 'ownerName',
			repo: 'repoName',
			release_id: FAKE_RELEASE_ID,
		}),
	);
});

test('Publish script filter artifacts by extensions', async () => {
	const { default: main } = await import('./main');

	getReleaseByTag.mockReturnValueOnce(
		Promise.resolve({
			data: { id: FAKE_RELEASE_ID },
		}),
	);
	await main({
		dir: '/foo/bar',
		tag: FAKE_RELEASE_ID,
		overwrite: true,
		extensions: ['msi'],
	});

	expect(Octokit).toBeCalledWith({ auth: 'FAKE_TOKEN' });
	expect(uploadReleaseAsset).toBeCalledWith(
		expect.objectContaining({
			name: 'Deepink-0.0.0.msi',
			owner: 'ownerName',
			repo: 'repoName',
			release_id: FAKE_RELEASE_ID,
		}),
	);

	expect(uploadReleaseAsset).not.toBeCalledWith(
		expect.objectContaining({
			name: 'deepink-0.0.0.deb',
			owner: 'ownerName',
			repo: 'repoName',
			release_id: FAKE_RELEASE_ID,
		}),
	);
});

describe('CLI arguments parser', () => {
	const originalArgv = process.argv;
	beforeEach(async () => {
		process.argv = [...originalArgv];
	});

	test('Contains all necessary properties after parsing', async () => {
		process.argv.push('--dir', '/foo/bar');

		expect(parseArgs()).toEqual({
			dir: '/foo/bar',
			overwrite: false,
			tag: 'v' + packageInfo.version,
		});
	});

	test('Pass custom tag', async () => {
		process.argv.push('--dir', '/foo/bar');

		expect(parseArgs(), 'current tag from package.json').toHaveProperty(
			'tag',
			'v' + packageInfo.version,
		);

		process.argv = [...originalArgv, '--dir', '/foo/bar', '--tag', '1.1.1'];
		expect(parseArgs(), 'current tag from package.json').toHaveProperty(
			'tag',
			'1.1.1',
		);
	});

	test('Throw error if no arguments provided', async () => {
		expect(() => parseArgs()).toThrow('process.exit unexpectedly called with "1"');
	});
});
