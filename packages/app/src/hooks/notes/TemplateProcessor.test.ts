import { TemplateProcessor } from './TemplateProcessor';

test('Compile template with time', () => {
	vi.setSystemTime(100_000);

	const templates = new TemplateProcessor({
		ignoreParsingErrors: true,
		timezone: 'Europe/Berlin',
	});

	expect(templates.compile(`New note {date}`)).toBe('New note 01/01/1970');
	expect(templates.compile(`New note {  date  }`)).toBe('New note 01/01/1970');

	expect(templates.compile(`New note {date:DD/MM/YYYY} at {date:HH:mm:ss}`)).toBe(
		'New note 01/01/1970 at 01:01:40',
	);

	expect(templates.compile(`New note {date:DD/MM/YYYY`)).toBe(
		'New note {date:DD/MM/YYYY',
	);
});

test('Compile template with localized time', async () => {
	vi.setSystemTime(100_000);

	expect(
		new TemplateProcessor({
			ignoreParsingErrors: true,
			timezone: 'Europe/Berlin',
			language: 'en',
		}).compile(`{date:ddd MMM DD YYYY}`),
	).toBe('Thu Jan 01 1970');

	await import(`dayjs/locale/ru.js`);
	expect(
		new TemplateProcessor({
			ignoreParsingErrors: true,
			timezone: 'Europe/Berlin',
			language: 'ru',
		}).compile(`{date:ddd MMM DD YYYY}`),
	).toBe('чтв янв. 01 1970');

	await import(`dayjs/locale/ja.js`);
	expect(
		new TemplateProcessor({
			ignoreParsingErrors: true,
			timezone: 'Europe/Berlin',
			language: 'ja',
		}).compile(`{date:ddd MMM DD YYYY}`),
	).toBe('木 1月 01 1970');
});
