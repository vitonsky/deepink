import { Telemetry } from '@core/features/telemetry/Telemetry';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { telemetryChannel } from '.';

export const serveTelemetry = (telemetry: Telemetry) =>
	telemetryChannel.server(ipcMainHandler, {
		async track({ req: [eventName, payload] }) {
			return telemetry.track(eventName, payload);
		},

		async getState({ req: [] }) {
			return telemetry.getState();
		},

		async handleQueue({ req: [] }) {
			return telemetry.handleQueue();
		},
	});
