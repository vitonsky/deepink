import path from 'path';

import { buildIco, buildIconSet, buildPng } from './icons';

async function buildIcons() {
	const iconsDir = path.resolve('./assets/icons');
	const sourceIcon = path.join(iconsDir, 'app.svg');

	const tasks: Promise<any>[] = [buildPng(sourceIcon), buildIco(sourceIcon)];

	// Build only if CLI tools available
	if (process.platform === 'darwin') {
		tasks.push(buildIconSet(sourceIcon, path.join(__dirname, 'icon-mask.svg')));
	}

	await Promise.all(tasks);
}

buildIcons();
