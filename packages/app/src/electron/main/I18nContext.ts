import 'dotenv/config';

import { createEffect, createStore, Effect, Store } from 'effector';
import i18next, { TFunction } from 'i18next';
import Backend, { FsBackendOptions } from 'i18next-fs-backend';
import { join } from 'path';
import { NAMESPACES } from 'src/i18n';
import { getResourcesPath } from '@electron/utils/files';

export type I18nContext = {
	t: TFunction;
	changeLanguage: Effect<string, void>;
	$language: Store<string>;
};

export const createNodeI18nContext = async (
	defaultLanguage: string,
): Promise<I18nContext> => {
	const loadPath = join(getResourcesPath(), 'locales/{{lng}}/{{ns}}.json');

	const t = await i18next.use(Backend).init<FsBackendOptions>({
		lng: defaultLanguage,
		fallbackLng: 'en',

		backend: {
			loadPath,
		},

		ns: NAMESPACES,
		defaultNS: NAMESPACES[0],
	});

	const $state = createStore({ language: defaultLanguage });
	const changeLanguage = createEffect(async (language: string) => {
		await i18next.changeLanguage(language);
	});

	$state.on(changeLanguage.done, (state, { params }) => ({
		...state,
		language: params,
	}));

	return {
		t,
		changeLanguage,
		$language: $state.map((state) => state.language),
	};
};
