import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { z } from 'zod';
import { EventBus } from '@api/events/EventBus';
import { GlobalEventsPayloadMap } from '@api/events/global';
// eslint-disable-next-line spellcheck/spell-checker
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@components/theme';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { App } from '@features/App/index';
import { TelemetryContext } from '@features/telemetry';
import { CommandEventProvider } from '@hooks/commands/CommandEventProvider';
import { GlobalEventBusContext } from '@hooks/events/useEventBus';
import { selectSettings, settingsApi } from '@state/redux/settings/settings';
import { store } from '@state/redux/store';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

const rawSettings = localStorage.getItem('settings');
if (rawSettings) {
	try {
		const settings = z
			.object({
				editorMode: z.union([
					z.literal('plaintext'),
					z.literal('richtext'),
					z.literal('split-screen'),
				]),
				theme: z.union([z.literal('zen'), z.literal('light')]),
			})
			.partial()
			.safeParse(JSON.parse(rawSettings));

		if (settings.data) {
			store.dispatch(settingsApi.setSettings(settings.data));
		}
	} catch (error) {
		console.error(error);
	}
}

store.subscribe(() => {
	const settings = selectSettings(store.getState());
	localStorage.setItem('settings', JSON.stringify(settings));
});

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
					<ChakraProvider theme={theme}>
						<App />
					</ChakraProvider>
				</CommandEventProvider>
			</GlobalEventBusContext>
		</Provider>
	</TelemetryContext>,
);
