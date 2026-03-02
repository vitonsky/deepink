import path from 'node:path';

import type { APIRoute } from 'astro';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

export const GET = (async () => {
	const sizes = [16, 32, 48, 64];

	const pngBuffers = await Promise.all(
		sizes.map((size) =>
			sharp(path.resolve('./public/favicon.svg'))
				.resize(size, size)
				.png()
				.toBuffer(),
		),
	);

	const icoBuffer = await pngToIco(pngBuffers);

	return new Response(new Blob([new Uint8Array(new Uint8Array(icoBuffer.buffer))]), {
		headers: {
			'Content-Type': 'image/x-icon',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
}) satisfies APIRoute;
