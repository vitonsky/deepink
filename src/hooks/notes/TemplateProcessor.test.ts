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
