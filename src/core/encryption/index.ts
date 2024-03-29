export interface IEncryptionController {
	encrypt: <T extends string | ArrayBuffer>(rawData: T) => Promise<T>;
	decrypt: <T extends string | ArrayBuffer>(encryptedData: T) => Promise<T>;
}

export interface IEncryptionProcessor {
	encrypt: (rawData: ArrayBuffer) => Promise<ArrayBuffer>;
	decrypt: (encryptedData: ArrayBuffer) => Promise<ArrayBuffer>;
}

/**
 * Interface to create and read header block
 */
export interface HeaderView<T> {
	readonly bufferSize: number;
	createBuffer(data: T): ArrayBuffer;
	readBuffer(buffer: ArrayBuffer): T;
}

/**
 * Creates buffer with random values
 */
export type RandomBytesGenerator = (bufferSize: number) => ArrayBuffer;
