import { convertBufferToTransferable } from './buffers';

describe('convertBufferToTransferable', () => {
	test('Buffer', () => {
		const [buffer, convertBack] = convertBufferToTransferable(
			new Buffer([10, 20, 30]),
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
