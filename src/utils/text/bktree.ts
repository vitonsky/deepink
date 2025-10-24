export type DistanceFn = (a: string, b: string) => number;

export class BKTree {
	private word: string;
	private children: Map<number, BKTree>;
	private distance: DistanceFn;

	constructor(wordOrFn: string | DistanceFn, distanceFn?: DistanceFn) {
		if (typeof wordOrFn === 'string') {
			this.word = wordOrFn;
			this.distance = distanceFn!;
		} else {
			this.word = '';
			this.distance = wordOrFn;
		}
		this.children = new Map();
	}

	// Add a word to the tree
	add(word: string) {
		if (!this.word) {
			this.word = word;
			return;
		}

		const d = this.distance(word, this.word);
		if (this.children.has(d)) {
			this.children.get(d)!.add(word);
		} else {
			this.children.set(d, new BKTree(word, this.distance));
		}
	}

	// Search words within maxDist
	search(query: string, maxDist: number, limit?: number): Array<[number, string]> {
		const results: Array<[number, string]> = [];
		const d = this.distance(query, this.word);
		if (d <= maxDist) {
			results.push([d, this.word]);
		}

		// Search in nested nodes
		if (limit === undefined || results.length < limit) {
			for (const [childDist, childNode] of this.children) {
				if (childDist >= d - maxDist && childDist <= d + maxDist) {
					results.push(
						...childNode.search(
							query,
							maxDist,
							limit ? limit - results.length : undefined,
						),
					);
				}

				if (limit !== undefined && results.length >= limit) break;
			}
		}

		return results.slice(0, limit);
	}
}
