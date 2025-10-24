import { OffsetsRange } from './findTextSegments';

export const getHighlightedText = (
	text: string,
	highlights: OffsetsRange[],
	{ limit = text.length }: { limit?: number } = {},
) => {
	const segments: (OffsetsRange & { highlight: boolean })[] = [];

	// Return whole text if no highlights
	if (highlights.length === 0) {
		segments.push({
			start: 0,
			end: Math.min(text.length, limit ?? text.length),
			highlight: false,
		});

		return segments;
	}

	for (let i = 0; i < highlights.length; i++) {
		const range = highlights[i];

		const firstSegment = segments[0];
		const lastSegment = segments[segments.length - 1];

		let charsLeft = Math.max(
			0,
			firstSegment && lastSegment ? lastSegment.end - firstSegment.start : limit,
		);

		// No chars left
		if (charsLeft === 0) break;

		// Fill the gape if needed
		if (lastSegment) {
			const charsGap = range.start - lastSegment.end;

			if (charsGap > 0) {
				const start = lastSegment.end;
				const end = start + Math.min(charsLeft, range.start - lastSegment.end);

				const len = end - start;
				if (len > 0) {
					segments.push({
						start,
						end,
						highlight: false,
					});
				}

				charsLeft -= len;

				if (0 >= charsLeft) break;
			}
		}

		// Add segment with line truncation if needed
		if (range.end - range.start > charsLeft) {
			// Truncate segment and exit since no chars left
			segments.push({
				start: range.start,
				end: range.start + charsLeft,
				highlight: true,
			});

			break;
		} else {
			segments.push({
				...range,
				highlight: true,
			});
		}
	}

	let charsLeft = limit - (segments[segments.length - 1].end - segments[0].start);

	// Add text before highlighting
	if (charsLeft > 0) {
		segments.unshift({
			start: Math.max(0, segments[0].start - charsLeft),
			end: segments[0].start,
			highlight: false,
		});

		charsLeft -= segments[0].end - segments[0].start;
	}

	// Add text after highlighting
	if (charsLeft > 0) {
		const lastSegment = segments[segments.length - 1];
		segments.push({
			start: lastSegment.end,
			end: lastSegment.end + charsLeft,
			highlight: false,
		});
	}

	return segments;
};
