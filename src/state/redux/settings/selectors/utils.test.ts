import { normalizeFontFamily } from './utils';

test('Normalize font families', () => {
	expect(normalizeFontFamily(``)).toBe(``);
	expect(normalizeFontFamily(`   `)).toBe(``);

	expect(normalizeFontFamily(`Arial`)).toBe(`"Arial"`);
	expect(normalizeFontFamily(`   Arial   `)).toBe(`"Arial"`);

	expect(normalizeFontFamily(`Open Sans`)).toBe(`"Open Sans"`);
	expect(normalizeFontFamily(`"Open Sans"`)).toBe(`"Open Sans"`);
	expect(normalizeFontFamily(`'Open Sans'`)).toBe(`"Open Sans"`);
	expect(normalizeFontFamily(`"Open Sans", monospace`)).toBe(
		`"\\"Open Sans\\", monospace"`,
	);
	expect(normalizeFontFamily(`'Open Sans', monospace`)).toBe(
		`"'Open Sans', monospace"`,
	);
});
