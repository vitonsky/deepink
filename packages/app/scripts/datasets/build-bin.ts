import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs';

import sax from 'sax';
import bz2 from 'unbzip2-stream';

const INPUT = 'bench-data/wiki/raw/dump.xml.bz2';
const OUTPUT = 'bench-data/wiki/processed/articles.bin';

const MAX_DOCS = 100_000;
const MAX_LEN = 2000;

function clean(text: string): string {
	return text
		.replace(/\{\{[^}]+\}\}/g, '')
		.replace(/\[\[|\]\]/g, '')
		.replace(/==.*?==/g, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export default async function buildWiki(): Promise<void> {
	if (existsSync(OUTPUT)) {
		console.log('already built');
		return;
	}

	mkdirSync('bench-data/wiki/processed', { recursive: true });

	const out = createWriteStream(OUTPUT);
	const parser = sax.createStream(true);

	let currentTag = '';
	let textParts: string[] = [];
	let count = 0;

	const stream = createReadStream(INPUT).pipe(bz2());

	parser.on('opentag', (node) => {
		currentTag = node.name;
		if (node.name === 'page') {
			textParts = [];
		}
	});

	parser.on('text', (text) => {
		if (currentTag === 'text') {
			textParts.push(text);
		}
	});

	parser.on('closetag', (tag) => {
		if (tag !== 'page') return;

		if (count >= MAX_DOCS) {
			stream.destroy(); // HARD STOP (critical)
			return;
		}

		const raw = textParts.join('');
		const cleaned = clean(raw);

		if (cleaned.length < 200) return;

		const sliced = cleaned.slice(0, MAX_LEN);

		const buf = Buffer.from(sliced, 'utf-8');
		const len = Buffer.allocUnsafe(4);
		len.writeUInt32LE(buf.length);

		out.write(len);
		out.write(buf);

		count++;

		if (count % 1000 === 0) {
			process.stdout.write(`\r${count}/${MAX_DOCS}`);
		}
	});

	await new Promise<void>((resolve, reject) => {
		stream.pipe(parser).on('end', resolve).on('close', resolve).on('error', reject);
	});

	out.end();
	process.stdout.write('\n');
	console.log('done:', count);
}
