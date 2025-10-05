export function escapeFileName(name: string, replacement = '_'): string {
	// Replace control chars and reserved filename chars
	return name
		.replace(/[^\p{L}\d.\-]+/gu, replacement) // anything not a letter
		.replace(new RegExp(`${replacement}{2,}`, 'g'), replacement) // collapse repeats
		.replace(new RegExp(`^${replacement}|${replacement}$`, 'g'), ''); // trim edges
}

/**
 * removes empty segments (from repeated slashes)
 */
export const normalizeSegments = (parts: string[]) => parts.filter(Boolean);

export const joinPathSegments = (segments: string[]) =>
	'/' +
	normalizeSegments(
		segments.map((segment) => normalizeSegments(segment.split('/')).join('/')),
	).join('/');

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

	// Combine base dir + relative path segments
	const relSegments = normalizeSegments(rel.split('/'));
	// If rel is absolute, set empty base name
	// Split and normalize base segments
	const stack: string[] = rel.startsWith('/') ? [] : normalizeSegments(base.split('/'));
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

/**
 * Returns a relative path based on a base path
 */
export const getRelativePath = (path: string, base: string): string => {
	const pathSegments = normalizeSegments(getResolvedPath(path, '/').split('/'));
	const baseSegments = normalizeSegments(getResolvedPath(base, '/').split('/'));

	const notEqualSegmentIndex = pathSegments.findIndex(
		(segment, index) => baseSegments[index] !== segment,
	);

	// If >0, then path is larger than base path and vice versa
	const segmentsSizeDelta = pathSegments.length - baseSegments.length;
	let levelsToUp = segmentsSizeDelta < 0 ? Math.abs(segmentsSizeDelta) : 0;
	if (notEqualSegmentIndex !== -1) {
		levelsToUp +=
			pathSegments.length -
			notEqualSegmentIndex -
			(segmentsSizeDelta > 0 ? segmentsSizeDelta : 0);
	}

	const relativePath: string[] =
		levelsToUp === 0 ? ['.'] : Array(levelsToUp).fill('..');
	if (notEqualSegmentIndex !== -1) {
		relativePath.push(...pathSegments.slice(notEqualSegmentIndex));
	}

	return relativePath.length === 0 ? './' : relativePath.join('/');
};
