// eslint-disable-next-line import/no-unresolved
import crc32 from 'crc/calculators/crc32';

import { joinArrayBuffers } from './buffers';
import { ICipher } from '.';

type Header = {
	crc32: number;
};

const headerSize = 8;

function createHeader(data: Header) {
	const buffer = new ArrayBuffer(headerSize);
	const view = new DataView(buffer, 0);

	view.setInt32(0, data.crc32);

	return buffer;
}

function getHeader(buffer: ArrayBuffer): Header {
	if (buffer.byteLength < headerSize)
		throw new TypeError('Header buffer have too small size');

	const view = new DataView(buffer, 0, headerSize);

	return {
		crc32: view.getInt32(0),
	};
}

export class IntegrityError extends TypeError {
	public readonly name = 'IntegrityError';
}

export class EncryptionIntegrityCheck implements ICipher {
	private readonly cipher;
	constructor(cipher: ICipher) {
		this.cipher = cipher;
	}

	public encrypt = async (data: ArrayBuffer) => {
		const bufferSum = crc32(new Uint8Array(data));
		const header = createHeader({
			crc32: bufferSum,
		});

		return this.cipher.encrypt(joinArrayBuffers([header, data]));
	};

	public decrypt = async (encryptedBuffer: ArrayBuffer) => {
		const decryptedBuffer = await this.cipher.decrypt(encryptedBuffer);

		const header = getHeader(decryptedBuffer);
		const data = decryptedBuffer.slice(headerSize);

		const bufferSum = crc32(new Uint8Array(data));
		if (bufferSum !== header.crc32)
			throw new IntegrityError('Decryption error. Check sum does not match');

		return data;
	};
}
