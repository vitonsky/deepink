import checkDiskSpace from 'check-disk-space';
import { randomUUID } from 'crypto';
import { app, nativeTheme, powerMonitor, screen, session } from 'electron';
import os from 'os';
import si from 'systeminformation';
import { VersionsSummary } from '@core/features/telemetry/AppVersions';
import { isDevMode } from '@electron/utils/app';
import { getUserDataPath } from '@electron/utils/files';

import { getAbout } from '../../about';

function convertBooleanValue(value?: boolean) {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
	return typeof value === 'boolean' ? String(Boolean(value)) : value;
}

function clampNumber(number: number, clamp = 10): number {
	return Math.floor(number / clamp) * clamp;
}

async function getStaticInfo() {
	const displayInfo = screen.getPrimaryDisplay();

	const cpus = os.cpus();
	const ramSizeInGb = Math.floor(os.totalmem() / 1024 ** 3);

	const [system, cpu] = await Promise.all([si.system(), si.cpu()]);

	return {
		// Used to group events per session
		sessionId: randomUUID(),
		version: getAbout().version,
		userAgent: session.defaultSession.getUserAgent(),
		developer: convertBooleanValue(isDevMode()),

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

export const createTelemetrySession = (versionsInfo: VersionsSummary) => {
	const sessionStartTime = Date.now();
	const getSessionTime = () => Math.floor((Date.now() - sessionStartTime) / 1000);

	const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

	let staticInfo: ReturnType<typeof getStaticInfo> | null = null;
	let installTime: {
		firstVersion: number;
		currentVersion: number;
	} | null = null;

	return async () => {
		// Fetch static info once
		if (!staticInfo) {
			staticInfo = getStaticInfo();
		}

		if (installTime === null) {
			installTime = {
				firstVersion: versionsInfo.versions[0]?.installedAt ?? Date.now(),
				currentVersion: versionsInfo.isVersionUpdated
					? Date.now()
					: (versionsInfo.versions.slice(-1)[0]?.installedAt ?? Date.now()),
			};
		}

		const [staticProps, diskSpace, battery] = await Promise.all([
			staticInfo,
			checkDiskSpace(getUserDataPath()),
			si.battery(),
		]);

		return {
			...staticProps,

			installAgeInDays: Math.floor(
				(Date.now() - installTime.currentVersion) / ONE_DAY_IN_MS,
			),
			firstInstallInDays: Math.floor(
				(Date.now() - installTime.firstVersion) / ONE_DAY_IN_MS,
			),

			sessionTimeInSeconds: getSessionTime(),

			// Device info
			deviceHasBattery: convertBooleanValue(battery.hasBattery),
			deviceBatteryPercent: battery.percent,
			deviceBatteryCharging: convertBooleanValue(battery.isCharging),
			isOnBatteryPower: convertBooleanValue(powerMonitor.isOnBatteryPower()),

			// Preferred themes
			highContrast: convertBooleanValue(nativeTheme.shouldUseHighContrastColors),
			shouldUseDarkColors: convertBooleanValue(nativeTheme.shouldUseDarkColors),

			diskSpaceTotal: clampNumber(diskSpace.size / 1024 ** 3, 10),
			diskSpaceFree: clampNumber(diskSpace.free / 1024 ** 3, 10),
		};
	};
};
