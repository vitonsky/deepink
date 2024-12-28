import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import z from 'zod';
// eslint-disable-next-line spellcheck/spell-checker
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@components/theme';
import { App } from '@features/App/index';
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

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<Provider store={store}>
		<ChakraProvider theme={theme}>
			<App />
		</ChakraProvider>
	</Provider>,
);
