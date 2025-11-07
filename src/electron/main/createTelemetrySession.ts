import checkDiskSpace from 'check-disk-space';
import { randomUUID } from 'crypto';
import { app, nativeTheme, powerMonitor, screen, session } from 'electron';
import os from 'os';
import si from 'systeminformation';
import { getUserDataPath } from '@electron/utils/files';

function convertBooleanValue(value?: boolean) {
	return typeof value === 'boolean' ? String(Boolean(value)) : value;
}

function clampDiskGB(size: number, clamp = 10): number {
	return Math.floor(size / clamp) * clamp;
}

async function getStaticInfo() {
	const displayInfo = screen.getPrimaryDisplay();

	const cpus = os.cpus();
	const ramSizeInGb = Math.floor(os.totalmem() / 1024 ** 3);

	const [system, cpu] = await Promise.all([si.system(), si.cpu()]);

	return {
		// Used to group events per session
		sessionId: randomUUID(),
		version: app.getVersion(),
		userAgent: session.defaultSession.getUserAgent(),

		// User bucket info
		language: app.getPreferredSystemLanguages()[0],
		languages: app.getPreferredSystemLanguages().join(',') || undefined,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

		screenReaderEnabled: convertBooleanValue(app.isAccessibilitySupportEnabled()),

		// Hardware info
		platform: process.platform,

		systemManufacturer: system.manufacturer,
		systemModel: system.model,
		isVirtualSystem: convertBooleanValue(system.virtual),

		cpuModel: cpus[0].model,
		cpuSpeed: cpus[0].speed,
		cpuCores: cpus.length,
		cpuPhysicalCores: cpu.physicalCores,

		ramSize: ramSizeInGb,

		displaySizeWidth: displayInfo.size.width,
		displaySizeHeight: displayInfo.size.height,
		displayWorkAreaWidth: displayInfo.workArea.width,
		displayWorkAreaHeight: displayInfo.workArea.height,
		displayFrequency: Math.floor(displayInfo.displayFrequency),
		displayScaleFactor: displayInfo.scaleFactor,
	};
}

export const createTelemetrySession = () => {
	const sessionStartTime = Date.now();
	const getSessionTime = () => Math.floor((Date.now() - sessionStartTime) / 1000);

	let staticInfo: ReturnType<typeof getStaticInfo> | null = null;

	// TODO: add install age in days
	return async () => {
		// Fetch static info once
		if (!staticInfo) {
			staticInfo = getStaticInfo();
		}

		const [staticProps, diskSpace, battery] = await Promise.all([
			staticInfo,
			checkDiskSpace(getUserDataPath()),
			si.battery(),
		]);

		return {
			...staticProps,

			sessionTimeInSeconds: getSessionTime(),

			// Device info
			deviceHasBattery: convertBooleanValue(battery.hasBattery),
			deviceBatteryPercent: battery.percent,
			deviceBatteryCharging: convertBooleanValue(battery.isCharging),
			isOnBatteryPower: convertBooleanValue(powerMonitor.isOnBatteryPower()),

			// Preferred themes
			highContrast: convertBooleanValue(nativeTheme.shouldUseHighContrastColors),
			shouldUseDarkColors: convertBooleanValue(nativeTheme.shouldUseDarkColors),

			diskSpaceTotal: clampDiskGB(diskSpace.size / 1024 ** 3),
			diskSpaceFree: clampDiskGB(diskSpace.free / 1024 ** 3),
		};
	};
};
