import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { EventBus } from '@api/events/EventBus';
import { GlobalEventsPayloadMap } from '@api/events/global';
import { patchWindow } from '@electron/requests/electronPatches/renderer';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { App } from '@features/App/index';
import { TelemetryContext } from '@features/telemetry';
import { ThemeProvider } from '@features/ThemeProvider';
import { CommandEventProvider } from '@hooks/commands/CommandEventProvider';
import { GlobalEventBusContext } from '@hooks/events/useEventBus';
import { loadStore, persistStore } from '@state/redux/persistence';
import { store } from '@state/redux/store';

patchWindow();

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

loadStore(store);
persistStore(store);

const event = createEvent<{
	name: string;
	payload: any;
}>();

const globalEventBus = {
	emit(eventName: string, payload?: any) {
		event({ name: eventName, payload });
	},
	listen(eventName, callback) {
		return event.watch((event) => {
			if (event.name !== eventName) return;

			callback(event.payload);
		});
	},
} satisfies EventBus<GlobalEventsPayloadMap>;

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<TelemetryContext value={telemetry}>
		<Provider store={store}>
			<GlobalEventBusContext value={globalEventBus}>
				<CommandEventProvider>
					<ThemeProvider>
						<App />
					</ThemeProvider>
				</CommandEventProvider>
			</GlobalEventBusContext>
		</Provider>
	</TelemetryContext>,
);
