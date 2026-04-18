import { combine, createApi, createEvent, createStore, sample } from 'effector';
import { DisposableBox } from '@utils/disposable';

export type VaultEntry = {
	id: string;
	name: string;
	isEncrypted: boolean;
};

// TODO: refactor to use one store and events instead of reducers
export const createVaultsApi = <T extends DisposableBox<unknown>>(
	autoChangeActiveVault = true,
) => {
	const $activeVault = createStore<T | null>(null);

	const $vaults = createStore<T[]>([]);
	const vaults = createApi($vaults, {
		add(state: T[], newVault: T) {
			return [...state, newVault];
		},
		delete(state: T[], deletedVault: T) {
			return state.filter((vault) => vault !== deletedVault);
		},
	});

	const $combinedStore = combine({
		activeVault: $activeVault,
		vaults: $vaults,
	});

	const vaultOpened = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	vaultOpened.watch(vaults.add as any);
	$activeVault.on(vaultOpened, (_state, vault) => vault);

	const vaultClosed = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	vaultClosed.watch(vaults.delete as any);

	// Dispose container
	vaultClosed.watch((vault) => {
		if (!vault.isDisposed()) {
			vault.dispose();
		}
	});

	// Update active vault
	sample({
		clock: vaultClosed,
		source: $combinedStore,
		filter({ activeVault }, vault) {
			return activeVault === vault;
		},
		fn({ vaults }, closedVault) {
			if (!autoChangeActiveVault) return null;

			return (
				[...vaults].reverse().find((vault) => vault !== closedVault) ?? null
			);
		},
		target: $activeVault,
	});

	const activeVaultChanged = createEvent<T | null>();

	// Set active vault
	sample({
		clock: activeVaultChanged,
		source: $combinedStore,
		filter({ activeVault, vaults }, vault) {
			if (vault === null) return true;

			return vault !== activeVault && vaults.includes(vault);
		},
		fn(_state, newActiveVault) {
			return newActiveVault;
		},
		target: $activeVault,
	});

	return {
		$activeVault,
		$vaults,
		events: {
			activeVaultChanged,
			vaultOpened,
			vaultClosed,
		},
	};
};
