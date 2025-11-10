/* eslint-disable camelcase */
/* eslint-disable spellcheck/spell-checker */
import { vol } from 'memfs';
import path from 'path';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));

const FAKE_RELEASE_ID = 'v0.0.0';

process.env.GITHUB_REPOSITORY = 'ownerName/repoName';
process.env.GITHUB_TOKEN = 'FAKE_TOKEN';

const createRelease = vi.fn();
const getReleaseByTag = vi.fn();
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
		'deepink-0.0.0.deb',
		'deepink-0.0.0.zip',
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
