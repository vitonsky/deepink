import Color from 'colorjs.io';

function getBrightness(color: string) {
	const base = new Color(color);
	return base.oklch[0]!;
}

function shiftBrightness(color: string, delta: number) {
	const base = new Color(color);
	const [L, C, H] = base.oklch;

	return new Color({
		space: 'oklch',
		coords: [Math.max(0, Math.min(1, L! + delta)), C, H],
	})
		.to('srgb')
		.toString({ format: 'hex' });
}

/**
 * Generates tones around an accent color
 * The accent color is available via key 500 (in the middle),
 * the lower keys represents a lighter colors, the greater keys are darken ones.
 * @param hex accent color
 */
export function tones(hex: string) {
	const brightness = getBrightness(hex);
	const brightnessBase = 1 - brightness;
	const darknessBase = brightness * -1;

	return {
		50: shiftBrightness(hex, brightnessBase * 0.95),
		100: shiftBrightness(hex, brightnessBase * 0.9),
		200: shiftBrightness(hex, brightnessBase * 0.8),
		300: shiftBrightness(hex, brightnessBase * 0.7),
		400: shiftBrightness(hex, brightnessBase * 0.2),
		500: hex,
		600: shiftBrightness(hex, darknessBase * 0.1),
		700: shiftBrightness(hex, darknessBase * 0.3),
		800: shiftBrightness(hex, darknessBase * 0.5),
		900: shiftBrightness(hex, darknessBase * 0.8),
	};
}

export function buildColorScheme(accentColor: string) {
	const primaryColorVariants = tones(accentColor);

	return {
		accent: primaryColorVariants['500'],
		primary: primaryColorVariants,
	};
}
