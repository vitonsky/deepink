import { TelemetryTracker } from '@core/features/telemetry/Telemetry';

import { createChannel } from '../../utils/ipc';

export const telemetryChannel = createChannel<{
	[K in keyof TelemetryTracker]: TelemetryTracker[K];
}>({ name: 'telemetry' });
