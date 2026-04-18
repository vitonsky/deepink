import { IFilesStorage } from '../features/files';

export type VaultObject = {
	id: string;
	name: string;
	encryption: null | {
		algorithm: string;
		salt: string;
		key: ArrayBuffer;
	};
};

// TODO: implement delete method
// TODO: implement update method
export class VaultsManager {
	constructor(
		private readonly filesController: IFilesStorage,
		private readonly getVaultFilesController: (vaultName: string) => IFilesStorage,
	) {}

	public async getVaults(): Promise<VaultObject[]> {
		const buffer = await this.filesController.get('vaults.json');
		if (!buffer) return [];

		try {
			const vaultsJson = new TextDecoder().decode(buffer);
			return JSON.parse(vaultsJson);
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	public async add(
		vaultData: Pick<VaultObject, 'name' | 'encryption'>,
	): Promise<VaultObject> {
		const vaults = await this.getVaults();

		const newVault: VaultObject = {
			...vaultData,
			id: self.crypto.randomUUID(),
		};

		vaults.push(newVault);

		const serializedVaults = JSON.stringify(vaults);
		const buffer = new TextEncoder().encode(serializedVaults);
		await this.filesController.write('vaults.json', buffer.buffer);

		// Write key
		if (vaultData.encryption) {
			const vaultFiles = this.getVaultFilesController(newVault.id);
			await vaultFiles.write('key', vaultData.encryption.key);
		}

		return newVault;
	}

	public async get(id: string): Promise<VaultObject | null> {
		const vaults = await this.getVaults();
		return vaults.find((vault) => vault.id === id) ?? null;
	}
}
