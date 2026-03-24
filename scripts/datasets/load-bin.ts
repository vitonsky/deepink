import { readFileSync } from 'node:fs';

export function loadDocs(): string[] {
	const buf = readFileSync('bench-data/wiki/processed/articles.bin');

	const docs: string[] = [];
	let offset = 0;

	while (offset < buf.length) {
		const len = buf.readUInt32LE(offset);
		offset += 4;

		const text = buf.toString('utf-8', offset, offset + len);
		offset += len;

		docs.push(text);
	}

	return docs;
}

// console.log(loadDocs()[100])
