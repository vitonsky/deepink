import { bytes, struct, transform, u8, u16, u32, u64 } from './binstruct';

const enc = new TextEncoder();
const dec = new TextDecoder();

describe('binstruct', () => {
	describe('struct', () => {
		it('calculates total size', () => {
			const Header = struct({ version: u8(), flags: u8(), length: u32() });
			expect(Header.size).toBe(6);
		});

		it('encodes and decodes flat struct', () => {
			const Header = struct({ version: u8(), flags: u8(), length: u32() });
			const buf = Header.encode({ version: 1, flags: 0, length: 1024 });
			expect(Header.decode(buf)).toStrictEqual({
				version: 1,
				flags: 0,
				length: 1024,
			});
		});

		it('decodes struct that has been built manually', () => {
			const buf = new Uint8Array(6);
			buf.set(new Uint8Array([10]), 0);
			buf.set(new Uint8Array([123]), 1);
			buf.set(new Uint8Array(new Uint32Array([1024]).buffer), 2);

			const Header = struct({ version: u8(), flags: u8(), length: u32() });
			expect(Header.decode(buf)).toStrictEqual({
				version: 10,
				flags: 123,
				length: 1024,
			});
		});

		it('encodes and decodes nested struct', () => {
			const Header = struct({ version: u8(), flags: u8(), length: u32() });
			const Packet = struct({ header: Header.field(), payload: bytes(4) });
			const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

			const buf = Packet.encode({
				header: { version: 1, flags: 0, length: 4 },
				payload,
			});

			expect(Packet.size).toBe(10);
			expect(Packet.decode(buf)).toStrictEqual({
				header: { version: 1, flags: 0, length: 4 },
				payload,
			});
		});
	});

	describe('transform', () => {
		it('encodes and decodes bytes as a string', () => {
			const Message = struct({
				id: u16(),
				text: transform(
					bytes(32),
					(str: string) => {
						const buf = new Uint8Array(32);
						buf.set(enc.encode(str).subarray(0, 32));
						return buf;
					},
					(buf) => dec.decode(buf).replace(/\0+$/, ''),
				),
			});

			const buf = Message.encode({ id: 42, text: 'hello world' });
			expect(Message.decode(buf)).toStrictEqual({ id: 42, text: 'hello world' });
		});

		it('encodes and decodes bytes as a mac address', () => {
			const MacAddress = struct({
				address: transform(
					bytes(6),
					(hex: string) =>
						new Uint8Array(hex.split(':').map((b) => parseInt(b, 16))),
					(buf) =>
						Array.from(buf)
							.map((b) => b.toString(16).padStart(2, '0'))
							.join(':'),
				),
			});

			const buf = MacAddress.encode({ address: 'de:ad:be:ef:00:01' });
			expect(MacAddress.decode(buf)).toStrictEqual({
				address: 'de:ad:be:ef:00:01',
			});
		});
	});

	describe('u64', () => {
		it('encodes and decodes big endian u64', () => {
			const Timestamp = struct({ seconds: u64('BE'), nanos: u32('BE') });
			const buf = Timestamp.encode({ seconds: 1700000000n, nanos: 500000000 });
			expect(Timestamp.decode(buf)).toStrictEqual({
				seconds: 1700000000n,
				nanos: 500000000,
			});
		});
	});
});
