/* eslint-disable no-bitwise */
export function mulberry32(seed: number): () => number {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export const createFakeRandomBytesGenerator = (seed: number) => {
	const getNextNumber = mulberry32(seed);
	return (length: number) => new Uint8Array(length).map(() => getNextNumber() * 256);
};
