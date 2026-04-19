/* eslint-disable @cspell/spellchecker */
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
		.resize(256, 256)
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
export async function buildIconSet(
	sourceFile: string,
	backgroundFile: string,
	iconScale = 0.9,
) {
	const iconName = path.basename(getFilenameWithNoExtension(sourceFile));
	const iconDir = path.dirname(sourceFile);

	const iconSetDir = path.join(iconDir, iconName + '.iconset');
	mkdirSync(iconSetDir, { recursive: true });

	const sizes = [1024, 512, 256];

	await Promise.all(
		sizes.map(async (size) => {
			for (let multiplier = 1; multiplier <= 2; multiplier++) {
				const sizeName =
					multiplier === 1 ? String(size) : `${size}@${multiplier}x`;

				const iconSize = size * multiplier;
				const sourceSize = Math.floor(iconSize * iconScale);

				// In case icon is not a square, macOS will insert square "mask" on background
				// To control an icon design we insert our own mask
				// The mask may be designed in .svg file
				await sharp(backgroundFile)
					.resize(iconSize, iconSize)
					.composite([
						{
							input: await sharp(sourceFile)
								.resize(sourceSize, sourceSize)
								.toBuffer(),
						},
					])
					.toBuffer()
					.then(async (buffer) =>
						writeFile(path.join(iconSetDir, `icon_${sizeName}.png`), buffer),
					);
			}
		}),
	);

	execFileSync(
		'iconutil',
		['-c', 'icns', iconSetDir, '-o', path.join(iconDir, iconName + '.icns')],
		{ shell: true },
	);

	rmSync(iconSetDir, { recursive: true });
}
