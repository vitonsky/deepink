import type { APIRoute } from 'astro';

import { getReleases } from '../features/releases';

export const GET = (async () => {
	const releases = await getReleases(import.meta.env.GITHUB_TOKEN);
	return new Response(JSON.stringify(releases), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}) satisfies APIRoute;
