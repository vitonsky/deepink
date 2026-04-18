import { VaultObject } from '@core/storage/VaultsManager';

type PickVaultResponse = { status: 'ok' } | { status: 'error'; message: string };

export type OnPickVault = (
	vault: VaultObject,
	password?: string,
) => Promise<PickVaultResponse>;
