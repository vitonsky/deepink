// eslint-disable-next-line import/no-unresolved
import crc32 from 'crc/calculators/crc32';

import { joinBuffers } from '../utils/buffers';
import { HeaderView, IEncryptionProcessor } from '..';

export type IntegrityHeaderStruct = {
	crc32: number;
};

export class IntegrityHeader implements HeaderView<IntegrityHeaderStruct> {
	public readonly bufferSize = 8;

	public createBuffer(data: IntegrityHeaderStruct): ArrayBuffer {
		const buffer = new ArrayBuffer(this.bufferSize);
		const view = new DataView(buffer, 0);

		view.setInt32(0, data.crc32);

		return buffer;
	}

	public readBuffer(buffer: ArrayBuffer): IntegrityHeaderStruct {
		if (buffer.byteLength < this.bufferSize)
			throw new TypeError('Header buffer have too small size');

		const view = new DataView(buffer, 0, this.bufferSize);

		return {
			crc32: view.getInt32(0),
		};
	}
}

export class IntegrityError extends TypeError {
	public readonly name = 'IntegrityError';
}

/**
 * Processor prepend a header with source buffer checksum during encryption,
 * and check the sum with actual buffer checksum during decryption.
 */
export class BufferIntegrityProcessor implements IEncryptionProcessor {
	private readonly integrityHeader;
	constructor() {
		this.integrityHeader = new IntegrityHeader();
	}

	public encrypt = async (buffer: ArrayBuffer) => {
		const bufferSum = crc32(new Uint8Array(buffer));
		const header = this.integrityHeader.createBuffer({
			crc32: bufferSum,
		});

		return joinBuffers([header, buffer]);
	};

	/**
	 * @throws `IntegrityError` when check sum do not match
	 */
	public decrypt = async (buffer: ArrayBuffer) => {
		const header = this.integrityHeader.readBuffer(buffer);
		const slicedBuffer = buffer.slice(this.integrityHeader.bufferSize);

		const bufferSum = crc32(new Uint8Array(slicedBuffer));
		if (bufferSum !== header.crc32)
			throw new IntegrityError('Decryption error. Check sum does not match');

		return slicedBuffer;
	};
}
