type Endian = 'LE' | 'BE';

interface Field<TInput, TOutput = TInput> {
	size: number;
	encode(value: TInput, view: DataView, offset: number): void;
	decode(view: DataView, offset: number): TOutput;
}

type Shape = Record<string, Field<unknown, unknown>>;

type EncodeShape<S extends Shape> = {
	[K in keyof S]: S[K] extends Field<infer I, unknown> ? I : never;
};

type DecodeShape<S extends Shape> = {
	[K in keyof S]: S[K] extends Field<unknown, infer O> ? O : never;
};

// ── Primitives ────────────────────────────────────────────────

export const u8 = (): Field<number> => ({
	size: 1,
	encode: (val, view, off) => view.setUint8(off, val),
	decode: (view, off) => view.getUint8(off),
});

export const u16 = (e: Endian = 'LE'): Field<number> => ({
	size: 2,
	encode: (val, view, off) => view.setUint16(off, val, e === 'LE'),
	decode: (view, off) => view.getUint16(off, e === 'LE'),
});

export const u32 = (e: Endian = 'LE'): Field<number> => ({
	size: 4,
	encode: (val, view, off) => view.setUint32(off, val, e === 'LE'),
	decode: (view, off) => view.getUint32(off, e === 'LE'),
});

export const u64 = (e: Endian = 'LE'): Field<bigint> => ({
	size: 8,
	encode: (val, view, off) => view.setBigUint64(off, val, e === 'LE'),
	decode: (view, off) => view.getBigUint64(off, e === 'LE'),
});

export const bytes = (length: number): Field<Uint8Array> => ({
	size: length,
	encode: (val, view, off) => {
		if (val.length !== length) {
			throw new RangeError(`Expected ${length} bytes, got ${val.length}`);
		}

		return new Uint8Array(view.buffer, view.byteOffset + off, length).set(val);
	},
	decode: (view, off) => new Uint8Array(view.buffer, view.byteOffset + off, length),
});

// ── Transform ─────────────────────────────────────────────────

export const transform = <TBase, TInput, TOutput>(
	field: Field<TBase>,
	encode: (value: TInput) => TBase,
	decode: (value: TBase) => TOutput,
): Field<TInput, TOutput> => ({
	size: field.size,
	encode: (val, view, off) => field.encode(encode(val), view, off),
	decode: (view, off) => decode(field.decode(view, off)),
});

// ── Struct ────────────────────────────────────────────────────

interface Struct<S extends Shape> {
	size: number;
	encode(obj: EncodeShape<S>): Uint8Array;
	decode(buffer: Uint8Array): DecodeShape<S>;
	field(): Field<EncodeShape<S>, DecodeShape<S>>;
}

export const struct = <S extends Shape>(fields: S): Struct<S> => {
	const entries = Object.entries(fields);
	const size = entries.reduce((acc, [, f]) => acc + f.size, 0);

	const encode = (obj: EncodeShape<S>): Uint8Array => {
		const buf = new Uint8Array(size);
		const view = new DataView(buf.buffer);
		let off = 0;
		for (const [key, field] of entries) {
			field.encode((obj as Record<string, unknown>)[key], view, off);
			off += field.size;
		}
		return buf;
	};

	const decode = (buffer: Uint8Array): DecodeShape<S> => {
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		const result: Record<string, unknown> = {};
		let off = 0;
		for (const [key, field] of entries) {
			result[key] = field.decode(view, off);
			off += field.size;
		}
		return result as DecodeShape<S>;
	};

	return {
		size,
		encode,
		decode,
		field: () => ({
			size,
			encode: (val, view, off) => {
				const encoded = encode(val);
				new Uint8Array(view.buffer, view.byteOffset + off, size).set(encoded);
			},
			decode: (view, off) =>
				decode(new Uint8Array(view.buffer, view.byteOffset + off, size)),
		}),
	};
};
