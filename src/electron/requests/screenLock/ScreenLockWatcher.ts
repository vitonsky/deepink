import { sessionBus } from 'dbus-ts';
import { powerMonitor } from 'electron';

const subscribeBusEvents = async (
	busName: string,
	objectPath: string,
	ifaceName: string,
	events: Record<string, (...args: any[]) => void>,
) => {
	const eventsList = Object.entries(events);

	try {
		// Hint when creating object which dbus type definitions should be used
		const bus = await sessionBus();
		const iface = await bus.getInterface(busName, objectPath, ifaceName);

		await Promise.all(eventsList.map(([name, callback]) => iface.on(name, callback)));

		return () => {
			Promise.all(
				eventsList.map(([name, callback]) => iface.off(name, callback)),
			).finally(() => bus.connection.end());
		};
	} catch (err) {
		// ignore missing services
		console.error(err);
	}

	return () => {};
};

export type LockState = 'locked' | 'unlocked';

export class ScreenLockWatcher {
	constructor(private readonly onChange?: (state: LockState) => void) {}
	private cleanupsPromise: Promise<(() => void)[]> | null = null;
	public async start() {
		if (this.cleanupsPromise !== null) throw new Error('Service is already in run');

		this.cleanupsPromise = Promise.all([
			this.watchPowerManagementEvents(),
			// TODO: run conditionally only for those who have dbus
			this.watchDBusEvents(),
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

	private async watchDBusEvents() {
		const cleanups = await Promise.all([
			// Login service & prepare for sleep events
			await subscribeBusEvents(
				'org.freedesktop.login1',
				'/org/freedesktop/login1',
				'org.freedesktop.login1.Manager',
				{
					PrepareForSleep: (sleeping: boolean) => {
						this.notify(sleeping ? 'locked' : 'unlocked');
					},
				},
			),

			// GNOME
			await subscribeBusEvents(
				'org.gnome.ScreenSaver',
				'/org/gnome/ScreenSaver',
				'org.gnome.ScreenSaver',
				{
					ActiveChanged: (active: boolean) => {
						this.notify(active ? 'locked' : 'unlocked');
					},
				},
			),

			// KDE + generic
			await subscribeBusEvents(
				'org.freedesktop.ScreenSaver',
				'/ScreenSaver',
				'org.freedesktop.ScreenSaver',
				{
					ActiveChanged: (active: boolean) => {
						this.notify(active ? 'locked' : 'unlocked');
					},
				},
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
