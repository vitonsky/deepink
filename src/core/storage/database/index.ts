import { Event } from 'effector';

/**
 * Database container for abstract database.
 *
 * The purpose is to introduce transparent way to manage database,
 * independent of DB implementation that may be changed depends on platform
 */
export type IDatabaseContainer<T> = {
	/**
	 * Returns database
	 */
	getDatabase: () => T;

	/**
	 * Get latest database data snapshot
	 */
	getData: () => Promise<ArrayBuffer>;

	/**
	 * Close database
	 */
	close: () => Promise<void>;

	/**
	 * Method to check database connection state
	 */
	isOpened: () => boolean;

	/**
	 * Event that fires when data has been changed
	 */
	onChanged: Event<void>;
};
