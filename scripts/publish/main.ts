/* eslint-disable camelcase */
/* eslint-disable spellcheck/spell-checker */
import 'dotenv/config';

import fg from 'fast-glob';
import fs from 'fs';
import mime from 'mime-types';
import pLimit from 'p-limit';
import path from 'path';
import { Octokit } from '@octokit/rest';

import { Args } from './args';

const EXT_WHITELIST = new Set(['.appimage', '.msi', '.dmg', '.zip', '.deb', '.rpm']);

function getArtifactName(filename: string, version: string) {
	const appName = 'Deepink';
	const extension = path.extname(filename);

	const artifactName =
		extension === '.zip'
			? path.basename(filename)
			: `${appName}-${version.replace(/^v/, '')}${extension}`;

	const shouldLowercaseName = ['.zip', '.deb', '.rpm'].includes(extension);
	return shouldLowercaseName ? artifactName.toLowerCase() : artifactName;
}

async function findArtifacts(dir: string, extensions?: string[]): Promise<string[]> {
	const extensionsList = extensions
		? new Set(extensions.map((ext) => '.' + ext))
		: EXT_WHITELIST;

	// find all files, then filter by ext (case-insensitive)
	const entries = await fg(['**/*'], {
		cwd: dir,
		dot: false,
		onlyFiles: true,
		followSymbolicLinks: true,
		fs: fs,
	});
	return entries
		.map((p) => path.join(dir, p))
		.filter((p) => extensionsList.has(path.extname(p).toLowerCase()));
}

async function ensureRelease(octokit: Octokit, owner: string, repo: string, tag: string) {
	try {
		const resp = await octokit.repos.getReleaseByTag({ owner, repo, tag });
		return resp.data; // release object
	} catch (err: any) {
		if (err.status === 404) {
			// create a new release (draft=false, prerelease=false)
			const created = await octokit.repos.createRelease({
				owner,
				repo,
				tag_name: tag,
				name: tag,
				draft: false,
				prerelease: /-.+$/.test(tag),
			});
			return created.data;
		}
		throw err;
	}
}

async function uploadAsset({
	octokit,
	owner,
	repo,
	releaseId,
	filePath,
	fileName,
	overwrite,
}: {
	octokit: Octokit;
	owner: string;
	repo: string;
	releaseId: number;
	filePath: string;
	fileName: string;
	overwrite: boolean;
}) {
	const name = fileName;

	// if overwrite, delete existing asset with same name
	if (overwrite) {
		const assetsResp = await octokit.repos.listReleaseAssets({
			owner,
			repo,
			release_id: releaseId,
		});
		const existing = assetsResp.data.find((a) => a.name === name);
		if (existing) {
			console.log(`Deleting existing asset: ${name} (id=${existing.id})`);
			await octokit.repos.deleteReleaseAsset({
				owner,
				repo,
				asset_id: existing.id,
			});
		}
	}

	const stat = await fs.promises.stat(filePath);
	const contentLength = stat.size;
	const contentType = mime.lookup(filePath) || 'application/octet-stream';

	const stream = fs.createReadStream(filePath);

	console.log(`Uploading ${name} (${contentLength} bytes, ${contentType})`);
	await octokit.repos.uploadReleaseAsset({
		owner,
		repo,
		release_id: releaseId,
		name,
		data: stream as any,
		headers: {
			'content-type': contentType,
			'content-length': String(contentLength),
		},
	});
	console.log(`Uploaded ${name}`);
}

export default async function (args: Args) {
	const token = process.env.GITHUB_TOKEN;
	const defaultOwnerRepo = process.env.GITHUB_REPOSITORY; // useful in GitHub Actions (owner/repo)
	if (!token) {
		console.error('GITHUB_TOKEN environment variable is required.');
		process.exit(1);
	}

	let owner = args.owner;
	let repo = args.repo;
	if (!owner || !repo) {
		if (defaultOwnerRepo) {
			const [o, r] = defaultOwnerRepo.split('/');
			owner = owner || o;
			repo = repo || r;
		}
	}
	if (!owner || !repo) {
		console.error(
			'owner/repo unknown. Provide --owner and --repo or set GITHUB_REPOSITORY env var.',
		);
		process.exit(1);
	}

	const octokit = new Octokit({ auth: token });

	const artifacts = await findArtifacts(args.dir, args.extensions);
	if (artifacts.length === 0) {
		console.log('No artifacts found.');
		return;
	}

	console.log(`Found ${artifacts.length} artifact(s):`);
	artifacts.forEach((a) => console.log(' -', a));

	const release = await ensureRelease(octokit, owner!, repo!, args.tag);
	const releaseId = release.id;
	console.log(`Using release: id=${releaseId} tag=${args.tag}`);

	const limit = pLimit(3); // upload concurrency
	const tasks = artifacts.map((filePath) =>
		limit(() =>
			uploadAsset({
				octokit,
				owner,
				repo,
				releaseId,
				filePath: filePath,
				fileName: getArtifactName(filePath, args.tag),
				overwrite: args.overwrite,
			}),
		),
	);

	await Promise.all(tasks);
	console.log('All uploads complete.');
}
