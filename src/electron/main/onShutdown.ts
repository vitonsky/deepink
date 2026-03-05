import { app } from 'electron';

type ShutdownCallback = (signal: string) => Promise<void> | void;

/**
 * Helper to run a callback by shutdown events
 */
export const onShutdown = (callback: ShutdownCallback) => {
	let isShuttingDown = false;

	const shutdown = async (signal: string) => {
		// Guard: prevent multiple simultaneous shutdowns
		if (isShuttingDown) return;
		isShuttingDown = true;

		console.log(`[shutdown] Received ${signal}`);

		// Force-exit watchdog: if cleanup takes too long — bail out
		const watchdog = setTimeout(() => {
			console.error('[shutdown] Graceful shutdown timed out. Forcing exit.');
			process.exit(1);
		}, 10000);

		// Don't let the watchdog timer keep the process alive on its own
		watchdog.unref();

		try {
			await callback(signal);
		} catch (err) {
			console.error('[shutdown] Error during cleanup:', err);
		} finally {
			clearTimeout(watchdog);
			// Let Electron properly close all windows and quit
			app.quit();
		}
	};

	const handlers: Record<string, () => void> = {
		// Ctrl+C
		SIGINT: () => shutdown('SIGINT'),
		// normal termination (systemd, docker, etc)
		SIGTERM: () => shutdown('SIGTERM'),
		// terminal closed / parent died
		SIGHUP: () => shutdown('SIGHUP'),
		// Ctrl+\
		SIGQUIT: () => shutdown('SIGQUIT'),
	};

	for (const [signal, handler] of Object.entries(handlers)) {
		process.once(signal, handler);
	}

	// Teardown function
	return () => {
		for (const [signal, handler] of Object.entries(handlers)) {
			process.off(signal, handler);
		}
	};
};
