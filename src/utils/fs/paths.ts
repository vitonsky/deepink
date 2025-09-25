/**
 * removes empty segments (from repeated slashes)
 */
export const normalizeSegments = (parts: string[]) => parts.filter(Boolean);

export const joinPathSegments = (segments: string[]) =>
	'/' + normalizeSegments(segments).join('/');

export const getPathSegments = (path: string) => {
	const segments = normalizeSegments(path.split('/'));

	return {
		basename: segments.slice(-1)[0],
		dirname: joinPathSegments(segments.slice(0, -1)),
	};
};

/**
 * Returns resolved path relatively to a base path
 */
export const getResolvedPath = (rel: string, base: string): string => {
	// Prepare base: ensure it's absolute
	if (!base.startsWith('/')) {
		throw new Error('base path must be absolute');
	}

	// TODO: handle cases like `/foo/bar/../x` to make it `/foo/x`
	// if rel is absolute, just normalize and return
	if (rel.startsWith('/')) {
		return joinPathSegments(normalizeSegments(rel.split('/')));
	}

	// Combine base dir + relative path segments
	const relSegments = normalizeSegments(rel.split('/'));
	// Split and normalize base segments
	const stack: string[] = normalizeSegments(base.split('/'));
	for (const segment of relSegments) {
		switch (segment) {
			case '.':
				continue;
			case '..':
				if (stack.length > 0) {
					stack.pop();
				}
				continue;
			default:
				stack.push(segment);
				continue;
		}
	}

	return joinPathSegments(stack);
};
