import { convertBufferToTransferable } from './WorkerEncryptionController';

test('Buffer', () => {
	const [buffer, convertBack] = convertBufferToTransferable(new Buffer(300));

	expect(buffer).toBeInstanceOf(ArrayBuffer);
	expect(convertBack(buffer)).toBeInstanceOf(Buffer);
});

test('Uint8Array', () => {
	const [buffer, convertBack] = convertBufferToTransferable(new Uint8Array(300));

	expect(buffer).toBeInstanceOf(ArrayBuffer);
	expect(convertBack(buffer)).toBeInstanceOf(Uint8Array);
});

// TODO: fix test
test.skip('Uint32Array', () => {
	const [buffer, convertBack] = convertBufferToTransferable(new Uint32Array([]));

	expect(buffer).toBeInstanceOf(ArrayBuffer);
	expect(convertBack(buffer)).toBeInstanceOf(Uint32Array);
});
