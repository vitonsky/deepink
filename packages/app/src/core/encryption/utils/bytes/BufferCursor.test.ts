import { BufferCursor } from './BufferCursor';

describe('Writing', () => {
	test('Data must be appended', () => {
		const buffer = new ArrayBuffer(10);
		const cursor = new BufferCursor(buffer);

		expect(new Uint8Array(buffer)).toStrictEqual(new Uint8Array(10).fill(0));

		cursor.writeBytes(new Uint8Array([1, 2, 3]));
		expect(new Uint8Array(buffer)).toStrictEqual(
			new Uint8Array([1, 2, 3, ...Array(7).fill(0)]),
		);

		cursor.writeBytes(new Uint8Array([4, 5, 6]));
		cursor.writeBytes(new Uint8Array([7]));
		cursor.writeBytes(new Uint8Array([8, 9, 10]));

		expect(new Uint8Array(buffer)).toStrictEqual(
			new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
		);
	});

	test('Error must be thrown for attempt of insertion a data larger than buffer size', () => {
		const buffer = new ArrayBuffer(10);
		const cursor = new BufferCursor(buffer);

		expect(new Uint8Array(buffer)).toStrictEqual(new Uint8Array(10).fill(0));

		// Start writing
		cursor.writeBytes(new Uint8Array([1, 2, 3]));
		expect(new Uint8Array(buffer)).toStrictEqual(
			new Uint8Array([1, 2, 3, ...Array(7).fill(0)]),
		);

		//
		expect(() => cursor.writeBytes(new Uint8Array(10))).toThrow(
			'Cannot insert 10 bytes. Remaining bytes in buffer: 7',
		);

		// Continue writing
		cursor.writeBytes(new Uint8Array([4]));
		expect(new Uint8Array(buffer)).toStrictEqual(
			new Uint8Array([1, 2, 3, 4, ...Array(6).fill(0)]),
		);
	});

	test('Error must be thrown if no space is left', () => {
		const buffer = new ArrayBuffer(10);
		const cursor = new BufferCursor(buffer);

		// Write full buffer
		cursor.writeBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
		expect(new Uint8Array(buffer)).toStrictEqual(
			new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
		);

		expect(() => cursor.writeBytes(new Uint8Array([1]))).toThrow(
			'Cannot insert 1 bytes. Remaining bytes in buffer: 0',
		);
	});
});

describe('Reading', () => {
	test('Reader must return bytes after cursor', () => {
		const buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer;
		const cursor = new BufferCursor(buffer);

		expect(cursor.readBytes(3)).toStrictEqual(new Uint8Array([1, 2, 3]));
		expect(cursor.readBytes(3)).toStrictEqual(new Uint8Array([4, 5, 6]));
		expect(cursor.readBytes(3)).toStrictEqual(new Uint8Array([7, 8, 9]));
		expect(cursor.readBytes(3)).toStrictEqual(new Uint8Array([10]));
	});

	test('Reader must return null when no bytes left after cursor', () => {
		const buffer = new Uint8Array([1, 2, 3]).buffer;
		const cursor = new BufferCursor(buffer);

		expect(cursor.readBytes(3)).toStrictEqual(new Uint8Array([1, 2, 3]));

		expect(cursor.readBytes(3)).toBe(null);
		expect(cursor.readBytes(3)).toBe(null);
		expect(cursor.readBytes(3)).toBe(null);
	});
});
