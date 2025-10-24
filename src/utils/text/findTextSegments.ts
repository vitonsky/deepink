import { distance } from 'fastest-levenshtein';

import { BKTree } from './bktree';
import { getLexemesList } from './getLexemesList';

/**
 * Returns normalized lexemes from text
 */
export const getLexemes = (text: string) => {
	const segmentsMap: Record<string, number> = {};

	for (const segment of getLexemesList(text, 1000)) {
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
		similarity = 0.7,
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
	for (const segment of getLexemesList(text, 1000)) {
		// Lazy search up to limit
		if (limit !== undefined && segments.length >= limit) break;

		// Only match a words
		if (!segment.isWordLike) continue;

		// Normalize segment to better matching
		const normalizedSegment = segment.segment
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.toLowerCase();

		const maxDifferentChars =
			normalizedSegment.length - Math.ceil(normalizedSegment.length * similarity);
		const isMatch =
			searchLexemesTree.search(normalizedSegment, maxDifferentChars, 1).length > 0;

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
