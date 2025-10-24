export function findSafeBreakPoint(input: string): number {
	// Work backwards from the end of the input
	for (let i = input.length - 1; i >= 0; i--) {
		// Check for whitespace or simple ASCII characters
		if (/\s/.test(input[i]) || /^[\x20-\x7E]$/.test(input[i])) {
			return i + 1;
		}
	}

	// If no safe break points were found, return the full length
	return input.length;
}

// Under the hood this util uses `Intl.Segmenter` and solves a problem
// with bad performance on large strings https://issues.chromium.org/issues/326176949
// That is an alternative to https://github.com/jonschlinkert/intl-segmenter
// We use own implementation due to bug in `intl-segmenter` - they do not add an offset to indexes in chunk
export function* getLexemesList(
	input: string,
	limit: number = 100,
): Generator<Intl.SegmentData> {
	let offset = 0;
	while (offset < input.length) {
		const remainingText = input.slice(offset);
		const chunkSize = Math.min(limit, remainingText.length);
		const potentialChunk = remainingText.slice(0, chunkSize);

		// Find a safe position to break the string
		const breakPoint = findSafeBreakPoint(potentialChunk);
		const chunk = potentialChunk.slice(0, breakPoint);

		const segmenter = new Intl.Segmenter('und', { granularity: 'word' });
		const segments = segmenter.segment(chunk);

		for (const segment of segments) {
			segment.index += offset;
			yield segment;
		}

		offset += breakPoint;
	}
}
