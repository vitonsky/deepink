import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';

export const useLocalizedDate = () => {
	const {
		i18n: { language },
	} = useTranslation(LOCALE_NAMESPACE.features);
	return useCallback(
		(date: Date) =>
			new Intl.DateTimeFormat(language, {
				weekday: 'short',
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			}).format(date),
		[language],
	);
};
