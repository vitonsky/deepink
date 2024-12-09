import { IFileController } from '@core/features/files';
import { debounce } from '@utils/debounce/debounce';

import { IDatabaseContainer } from '.';

export type IManagedDatabase<T> = {
	/**
	 * Returns database
	 */
	get: () => T;

	/**
	 * Write database to file
	 *
	 * DB automatically sync with updates, call this method to force sync
	 */
	sync: () => Promise<void>;

	/**
	 * Sync DB and close
	 */
	close: () => Promise<void>;
};

export type SyncRequest = {
	resolve(): void;
	reject(err: Error): void;
};

export type Options = {
	sync?: {
		delay: number;
		deadline: number;
	};
};

/**
 * Class to manage database data synchronization
 */
export class ManagedDatabase<T> implements IManagedDatabase<T> {
	public readonly dbContainer;
	private readonly dbFile: IFileController;
	private readonly debouncedSync;
	constructor(
		dbContainer: IDatabaseContainer<T>,
		dbFile: IFileController,
		{ sync = { delay: 300, deadline: 800 } }: Options = {},
	) {
		this.dbContainer = dbContainer;
		this.dbFile = dbFile;

		// Auto sync changes
		this.debouncedSync = debounce(
			() => {
				console.warn('Debounced sync');
				this.sync();
			},
			{ wait: sync.delay, deadline: sync.deadline },
		);

		// TODO: cleanup by close db
		dbContainer.onChanged.watch(this.debouncedSync);
	}

	public get = () => {
		return this.dbContainer.getDatabase();
	};

	private syncRequests: SyncRequest[] = [];

	private isSyncWorkerRun = false;
	private syncWorker = async () => {
		if (this.isSyncWorkerRun) return;

		this.isSyncWorkerRun = true;
		while (this.syncRequests.length > 0) {
			// Get requests to handle and flush array
			const syncRequestsInProgress = this.syncRequests;
			this.syncRequests = [];

			// Control execution and forward exceptions to promises
			try {
				console.log('DBG: dump...');
				// Dump data
				const buffer = await this.dbContainer.getData();

				console.log('DBG: write file...');
				// Write file
				await this.dbFile.write(buffer);

				console.log('DBG: resolve...');
				// Resolve requests
				syncRequestsInProgress.forEach((syncRequest) => syncRequest.resolve());
			} catch (err) {
				const errorToThrow =
					err instanceof Error ? err : new Error('Unknown error');
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(errorToThrow),
				);
			}
		}

		this.isSyncWorkerRun = false;
	};

	// Update database file
	public sync = () => {
		if (!this.dbContainer.isOpened()) throw new Error('Database are closed');

		return new Promise<void>((resolve, reject) => {
			console.warn('Sync call');
			// Add task
			this.syncRequests.push({ resolve, reject });

			// Run worker if not started
			this.syncWorker();
		});
	};

	public close = async () => {
		// Sync latest changes
		this.debouncedSync.cancel();

		await this.sync();
		await this.dbContainer.close();
	};
}
