/* eslint-disable spellcheck/spell-checker */
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { encode as encodeIco } from 'sharp-ico';

import { writeFile } from 'fs/promises';

function getFilenameWithNoExtension(filename: string) {
	return path.join(
		path.dirname(filename),
		path.basename(filename).split('.').slice(0, -1).join('.'),
	);
}

/**
 * Universal icon
 */
export async function buildPng(sourcePath: string) {
	const buffer = await sharp(sourcePath)
		.resize(512, 512)
		.png({ compressionLevel: 9 })
		.toBuffer();
	await writeFile(getFilenameWithNoExtension(sourcePath) + '.png', buffer);
}

/**
 * Build icons for Windows
 */
export async function buildIco(sourcePath: string) {
	const source = await sharp(sourcePath).resize(256, 256).toBuffer();

	await writeFile(getFilenameWithNoExtension(sourcePath) + '.ico', encodeIco([source]));
}

/**
 * Build icons for macOS
 */
export async function buildIconSet(sourceFile: string) {
	const iconName = path.basename(getFilenameWithNoExtension(sourceFile));
	const iconDir = path.dirname(sourceFile);

	const iconSetDir = path.join(iconDir, iconName + '.iconset');
	mkdirSync(iconSetDir, { recursive: true });

	const sizes = [512, 256];

	await Promise.all(
		sizes.map((size) =>
			sharp(sourceFile)
				.resize(size, size)
				.toBuffer()
				.then(async (buffer) =>
					writeFile(path.join(iconSetDir, `icon_${size}.png`), buffer),
				),
		),
	);

	execFileSync(
		'iconutil',
		['-c', 'icns', iconSetDir, '-o', path.join(iconDir, iconName + '.icns')],
		{ shell: true },
	);

	rmSync(iconSetDir, { recursive: true });
}
