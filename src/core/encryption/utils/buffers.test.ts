import { convertBufferToTransferable, joinBuffers } from './buffers';

describe('convertBufferToTransferable', () => {
	test('Buffer', () => {
		const [buffer, convertBack] = convertBufferToTransferable(
			Buffer.from([10, 20, 30]),
		);

		expect(buffer).toBeInstanceOf(ArrayBuffer);
		expect(convertBack(buffer)).toBeInstanceOf(Buffer);
	});

	test('Uint8Array', () => {
		const [buffer, convertBack] = convertBufferToTransferable(
			new Uint8Array([10, 20, 30]),
		);

		expect(buffer).toBeInstanceOf(ArrayBuffer);
		expect(convertBack(buffer)).toBeInstanceOf(Uint8Array);
	});

	test('Uint32Array', () => {
		const [buffer, convertBack] = convertBufferToTransferable(
			new Uint32Array([10, 20, 30]),
		);

		// Weird check for `ArrayBuffer` because bug in Jest: https://github.com/jestjs/jest/issues/10786
		expect(Object.getPrototypeOf(buffer)[Symbol.toStringTag]).toBe('ArrayBuffer');
		expect(convertBack(buffer)).toBeInstanceOf(Uint32Array);
	});
});

describe('joinBuffers', () => {
	test('Uint8Array', () => {
		const joinedBuffer = joinBuffers([
			new Uint8Array([1, 2, 3]),
			new Uint8Array([4, 5, 6]),
		]);
		expect(Array.from(new Uint8Array(joinedBuffer))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	test('Uint32Array', () => {
		const joinedBuffer = joinBuffers([
			new Uint32Array([1, 2, 3]),
			new Uint32Array([4, 5, 6]),
		]);
		expect(Array.from(new Uint32Array(joinedBuffer))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	test('BigInt64Array', () => {
		const b1 = new BigInt64Array(new ArrayBuffer(8));
		b1[0] = 100n;

		const b2 = new BigInt64Array(new ArrayBuffer(8));
		b2[0] = 200n;

		const joinedBuffer = joinBuffers([b1, b2]);
		expect(Array.from(new BigInt64Array(joinedBuffer))).toEqual([100n, 200n]);
	});

	// TODO: implement support of node buffers
	test.skip('Buffer', () => {
		const joinedBuffer = joinBuffers([
			Buffer.from([1, 2, 3]),
			Buffer.from([4, 5, 6]),
		]);
		expect(Array.from(new Uint32Array(joinedBuffer))).toEqual([1, 2, 3, 4, 5, 6]);
	});
});
