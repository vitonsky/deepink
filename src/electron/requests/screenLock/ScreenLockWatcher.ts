import dbus from 'dbus-next';
import { powerMonitor } from 'electron';

export type LockState = 'locked' | 'unlocked';

export class ScreenLockWatcher {
	constructor(private readonly onChange?: (state: LockState) => void) {}
	private cleanupsPromise: Promise<(() => void)[]> | null = null;
	public async start() {
		if (this.cleanupsPromise !== null) throw new Error('Service is already in run');

		this.cleanupsPromise = Promise.all([
			this.watchPowerManagementEvents(),
			this.watchPrepareForSleep(),
			this.watchDesktopEnvironmentEvents(),
		]);

		await this.cleanupsPromise;
	}

	public async stop() {
		if (this.cleanupsPromise === null) return;

		const cleanups = await this.cleanupsPromise;
		cleanups.forEach((stop) => stop());
	}

	private lastReportedStatus: LockState | null = null;
	private notify(status: LockState) {
		if (this.lastReportedStatus === status) return;
		this.lastReportedStatus = status;

		this.onChange?.(status);
	}

	private async watchPrepareForSleep() {
		const systemBus = dbus.systemBus();

		const login1 = await systemBus.getProxyObject(
			'org.freedesktop.login1',
			'/org/freedesktop/login1',
		);

		const manager = login1.getInterface('org.freedesktop.login1.Manager');

		manager.on('PrepareForSleep', (sleeping: boolean) => {
			this.notify(sleeping ? 'locked' : 'unlocked');
		});

		return () => {
			manager.removeAllListeners();
		};
	}

	private async watchDesktopEnvironmentEvents() {
		const sessionBus = dbus.sessionBus();

		const listenScreenSaver = async (
			busName: string,
			objectPath: string,
			ifaceName: string,
		) => {
			try {
				const obj = await sessionBus.getProxyObject(busName, objectPath);
				const iface = obj.getInterface(ifaceName);

				iface.on('ActiveChanged', (active: boolean) => {
					this.notify(active ? 'locked' : 'unlocked');
				});

				return () => {
					iface.removeAllListeners();
				};
			} catch {
				// silently ignore missing services
			}

			return () => {};
		};

		const cleanups = await Promise.all([
			// GNOME
			await listenScreenSaver(
				'org.gnome.ScreenSaver',
				'/org/gnome/ScreenSaver',
				'org.gnome.ScreenSaver',
			),

			// KDE + generic
			await listenScreenSaver(
				'org.freedesktop.ScreenSaver',
				'/ScreenSaver',
				'org.freedesktop.ScreenSaver',
			),
		]);

		return () => {
			cleanups.forEach((stop) => stop());
		};
	}

	private async watchPowerManagementEvents() {
		const onLocked = () => {
			this.notify('locked');
		};

		const onUnlocked = () => {
			this.notify('unlocked');
		};

		powerMonitor.on('lock-screen', onLocked);
		powerMonitor.on('unlock-screen', onUnlocked);

		return () => {
			powerMonitor.off('lock-screen', onLocked);
			powerMonitor.off('unlock-screen', onUnlocked);
		};
	}
}
