export interface EncryptionModule {
	encrypt: <T extends string | ArrayBuffer>(rawData: T) => Promise<T>;
	decrypt: <T extends string | ArrayBuffer>(encryptedData: T) => Promise<T>;
}
