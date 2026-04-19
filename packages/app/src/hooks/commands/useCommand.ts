import { useCallback, useContext } from 'react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';

import { CommandEventContext } from './CommandEventProvider';
import { CommandPayloadsMap } from '.';

/**
 * Provides a function that triggers a command event
 */
export const useCommand = () => {
	const telemetry = useTelemetryTracker();
	const commandEvent = useContext(CommandEventContext);

	return useCallback(
		<K extends keyof CommandPayloadsMap>(
			commandName: K,
			...args: CommandPayloadsMap[K] extends void
				? [payload?: void]
				: [payload: CommandPayloadsMap[K]]
		) => {
			const [payload] = args;
			commandEvent({ name: commandName, payload });

			telemetry.track(TELEMETRY_EVENT_NAME.COMMAND_USE, { command: commandName });
		},
		[commandEvent, telemetry],
	);
};
