import {
	selectSettings,
	settingsApi,
	settingsScheme,
} from '@state/redux/settings/settings';
import { AppStore } from '@state/redux/store';

export const loadStore = (store: AppStore) => {
	const rawSettings = localStorage.getItem('settings');
	if (rawSettings) {
		try {
			const settings = settingsScheme.partial().safeParse(JSON.parse(rawSettings));

			if (settings.data) {
				store.dispatch(settingsApi.setSettings(settings.data));
			}
		} catch (error) {
			console.error(error);
		}
	}
};

export const persistStore = (store: AppStore) => {
	return store.subscribe(() => {
		const settings = selectSettings(store.getState());
		localStorage.setItem('settings', JSON.stringify(settings));
	});
};
