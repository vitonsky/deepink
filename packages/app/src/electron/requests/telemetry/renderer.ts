import { TelemetryTracker } from '@core/features/telemetry/Telemetry';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { telemetryChannel } from '.';

export const telemetry = telemetryChannel.client(
	ipcRendererFetcher,
) satisfies TelemetryTracker;
