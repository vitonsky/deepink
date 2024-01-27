import { WorkerMessenger } from '../../utils/workers/WorkerMessenger';
import { WorkerRPC } from '../../utils/workers/WorkerRPC';

import { ICipher } from '.';

export class Terminable {
	private isFinished = false;

	public terminate() {
		this.isFinished = true;
	}
	public isTerminated() {
		return this.isFinished;
	}

	public throwErrorIfTerminated(message?: string) {
		const errorMessage =
			message ?? "Object been terminated and can't be used anymore";
		if (this.isFinished) throw new Error(errorMessage);
	}
}

/**
 * Receive any buffer and returns a converted transferable buffer and codec for revert converting
 *
 * Useful to convert buffer for transfer and then convert received buffer back.
 *
 * @param buffer
 * @returns [buffer, convertor]
 */
export const convertBufferToTransferable = (
	buffer: ArrayBuffer,
): [ArrayBuffer, (buffer: ArrayBuffer) => ArrayBuffer] => {
	if (buffer instanceof Buffer) {
		return [
			buffer.buffer,
			(buffer: ArrayBuffer) => {
				return Buffer.from(buffer);
			},
		];
	}

	// TODO: add tests
	// Typed arrays
	const typedArray = [
		Int8Array,
		Uint8Array,
		Uint8ClampedArray,
		Int16Array,
		Uint16Array,
		Int32Array,
		Uint32Array,
		Float32Array,
		Float64Array,
		BigInt64Array,
		BigUint64Array,
	].find((proto) => buffer instanceof proto);
	if (typedArray && buffer instanceof typedArray) {
		return [
			buffer.buffer,
			(buffer: ArrayBuffer) => {
				return new typedArray(buffer);
			},
		];
	}

	return [
		buffer,
		(buffer: ArrayBuffer) => {
			return buffer;
		},
	];
};

export class WorkerEncryptionController implements ICipher {
	private readonly worker;
	private readonly messenger;
	private readonly requests;
	constructor(secretKey: string | ArrayBuffer, salt: ArrayBuffer) {
		const worker = new Worker('./cryptographyWorker.js');
		this.messenger = new WorkerMessenger(worker);
		this.requests = new WorkerRPC(this.messenger);
		this.worker = this.requests
			.sendRequest('init', { secretKey, salt })
			.then(() => worker);
	}

	public async encrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();

		await this.worker;

		const [transferableBuffer, convertBufferBack] =
			convertBufferToTransferable(buffer);
		return this.requests
			.sendRequest('encrypt', transferableBuffer, [transferableBuffer])
			.then(convertBufferBack);
	}

	public async decrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();

		await this.worker;

		const [transferableBuffer, convertBufferBack] =
			convertBufferToTransferable(buffer);
		return this.requests
			.sendRequest('decrypt', transferableBuffer, [transferableBuffer])
			.then(convertBufferBack);
	}

	private readonly terminateStatus = new Terminable();
	public terminate() {
		this.messenger.destroy();
		this.terminateStatus.terminate();
	}
}
