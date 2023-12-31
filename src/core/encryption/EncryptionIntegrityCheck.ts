// eslint-disable-next-line import/no-unresolved
import crc32 from 'crc/calculators/crc32';

import { joinBuffers } from './utils/buffers';
import { HeaderView, ICipher } from '.';

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

export class EncryptionIntegrityCheck implements ICipher {
	private readonly cipher;
	private readonly integrityHeader;
	constructor(cipher: ICipher) {
		this.cipher = cipher;
		this.integrityHeader = new IntegrityHeader();
	}

	public encrypt = async (data: ArrayBuffer) => {
		const bufferSum = crc32(new Uint8Array(data));
		const header = this.integrityHeader.createBuffer({
			crc32: bufferSum,
		});

		return this.cipher.encrypt(joinBuffers([header, data]));
	};

	public decrypt = async (encryptedBuffer: ArrayBuffer) => {
		const decryptedBuffer = await this.cipher.decrypt(encryptedBuffer);

		const header = this.integrityHeader.readBuffer(decryptedBuffer);
		const data = decryptedBuffer.slice(this.integrityHeader.bufferSize);

		const bufferSum = crc32(new Uint8Array(data));
		if (bufferSum !== header.crc32)
			throw new IntegrityError('Decryption error. Check sum does not match');

		return data;
	};
}
