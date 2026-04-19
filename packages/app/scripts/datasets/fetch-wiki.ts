import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';

import { Estimation } from 'arrival-time';
import prettyBytes from 'pretty-bytes';

const URL =
	'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2';

const OUT = 'bench-data/wiki/raw/dump.xml.bz2';

export default async function download(): Promise<void> {
	if (existsSync(OUT)) {
		console.log('already downloaded');
		return;
	}

	mkdirSync('bench-data/wiki/raw', { recursive: true });

	await new Promise<void>((resolve, reject) => {
		https
			.get(URL, (res) => {
				const total = Number(res.headers['content-length'] || 0);

				const estimation = new Estimation({
					total,
				});

				let downloaded = 0;

				res.on('data', (chunk: Buffer) => {
					downloaded += chunk.length;

					const m = estimation.update(downloaded, total);

					const percent = total
						? ((downloaded / total) * 100).toFixed(2) + '%'
						: '--';

					const eta = m.estimate ? `${Math.round(m.estimate / 1000)}s` : '--';

					const speed = m.speed ? `${prettyBytes(m.speed)}/s` : '--';

					process.stdout.write(
						`\r${percent} | ${prettyBytes(downloaded)} / ${
							total ? prettyBytes(total) : 'unknown'
						} | ${speed} | ETA ${eta}`,
					);
				});

				pipeline(res, createWriteStream(OUT))
					.then(() => {
						process.stdout.write('\n');
						resolve();
					})
					.catch(reject);
			})
			.on('error', reject);
	});
}
