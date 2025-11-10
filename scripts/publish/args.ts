/* eslint-disable spellcheck/spell-checker */
import 'dotenv/config';

export type Args = {
	dir: string;
	tag: string;
	overwrite: boolean;
	owner?: string;
	repo?: string;
};

export function parseArgs(): Args {
	const argv = process.argv.slice(2);
	const out: Partial<Args> = { overwrite: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dir') out.dir = argv[++i];
		else if (a === '--tag') out.tag = argv[++i];
		else if (a === '--overwrite') out.overwrite = true;
		else if (a === '--owner') out.owner = argv[++i];
		else if (a === '--repo') out.repo = argv[++i];
		else {
			console.warn(`Unknown arg: ${a}`);
		}
	}
	if (!out.dir || !out.tag) {
		console.error(
			'Missing required args. Usage: --dir <path> --tag <tag> [--overwrite] [--owner OWNER] [--repo REPO]',
		);
		process.exit(1);
	}
	return out as Args;
}
