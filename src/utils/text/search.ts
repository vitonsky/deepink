import { distance } from 'fastest-levenshtein';
import { Segmenter } from 'intl-segmenter';

import { BKTree } from './bktree';

export const getLexemes = (text: string) => {
	const segmentsMap: Record<string, number> = {};

	const segmenter = new Segmenter('und', { granularity: 'word' });
	for (const segment of segmenter.segment(text)) {
		if (!segment.isWordLike) continue;

		const normalizedSegment = segment.segment
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.toLowerCase();

		segmentsMap[normalizedSegment] = 1 + (segmentsMap[normalizedSegment] ?? 0);
	}

	return segmentsMap;
};

export type OffsetsRange = {
	start: number;
	end: number;
};

export const findTextSegments = (
	text: string,
	searchPhrase: string,
	{
		similarity = 0.3,
		limit,
		joinDistance,
	}: {
		/**
		 * Similarity to match texts from 0 (not similar text) to 1 (equal text)
		 */
		similarity?: number;

		/**
		 * If provided, search will stop when number of segments will be found
		 */
		limit?: number;

		/**
		 * If provided number, segments will be joined in case
		 * a distance between them is less or equal to configured
		 */
		joinDistance?: number;
	} = {},
) => {
	// Build lexeme tree
	const searchLexemesTree = new BKTree(distance);
	for (const lexeme in getLexemes(searchPhrase)) {
		searchLexemesTree.add(lexeme);
	}

	// Build segments
	let segments: OffsetsRange[] = [];
	const segmenter = new Segmenter('und', { granularity: 'word', maxChunkLength: 1000 });
	for (const segment of segmenter.segment(text)) {
		// Lazy search up to limit
		if (limit !== undefined && segments.length >= limit) break;

		// Only match a words
		if (!segment.isWordLike) continue;

		// Normalize segment to better matching
		const normalizedSegment = segment.segment
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.toLowerCase();

		const maxDiffChars = Math.ceil(normalizedSegment.length * similarity);
		const isMatch =
			searchLexemesTree.search(normalizedSegment, maxDiffChars, 1).length > 0;

		if (isMatch) {
			segments.push({
				start: segment.index,
				end: segment.index + segment.segment.length,
			});
		}
	}

	if (joinDistance !== undefined && joinDistance >= 0 && segments.length > 1) {
		const joinedSegments: OffsetsRange[] = [];

		let currentSegment: OffsetsRange | null = null;
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];

			// Assign segment and continue
			// This code ensures we work with 2 different segments below
			if (currentSegment === null) {
				currentSegment = segment;
				continue;
			}

			const distance = segment.start - currentSegment.end;
			if (distance <= joinDistance) {
				// Expand current segment
				currentSegment.end = segment.end;
			} else {
				// Break segments
				joinedSegments.push(currentSegment);
				currentSegment = segment;
			}
		}

		// Add last segment
		if (currentSegment) {
			joinedSegments.push(currentSegment);
		}

		segments = joinedSegments;
	}

	return segments;
};

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
