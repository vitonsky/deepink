/* eslint-disable spellcheck/spell-checker */
import 'dotenv/config';

import packageInfo from '../../package.json';

export type Args = {
	dir: string;
	tag: string;
	overwrite: boolean;
	owner?: string;
	repo?: string;
	extensions?: string[];
};

export function parseArgs(): Args {
	const argv = process.argv.slice(2);
	const out: Partial<Args> = { overwrite: false, tag: `v${packageInfo.version}` };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dir') out.dir = argv[++i];
		else if (a === '--tag') out.tag = argv[++i];
		else if (a === '--overwrite') out.overwrite = true;
		else if (a === '--owner') out.owner = argv[++i];
		else if (a === '--repo') out.repo = argv[++i];
		else if (a === '--extensions') out.extensions = (argv[++i] ?? '').split(',');
		else {
			console.warn(`Unknown arg: ${a}`);
		}
	}

	if (!out.dir || !out.tag) {
		console.error(
			'Missing required args. Usage: --dir <path> [--tag <tag>] [--overwrite] [--owner OWNER] [--repo REPO] [--extensions EXTENSIONS_LIST]',
		);
		process.exit(1);
	}
	return out as Args;
}
