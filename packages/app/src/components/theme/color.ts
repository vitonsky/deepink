/* eslint-disable @cspell/spellchecker */
import Color from 'colorjs.io';

export function getBrightness(color: string) {
	const base = new Color(color);
	return base.oklch[0]!;
}

export function shiftBrightness(color: string, delta: number) {
	const base = new Color(color);
	const [L, C, H] = base.oklch;

	return new Color({
		space: 'oklch',
		coords: [Math.max(0, Math.min(1, L! + delta)), C, H],
	})
		.to('srgb')
		.toString({ format: 'hex' });
}

export function setBrightness(color: string, brightness: number) {
	const base = new Color(color);
	const [_L, C, H] = base.oklch;

	return new Color({
		space: 'oklch',
		coords: [Math.max(0, Math.min(1, brightness)), C, H],
	})
		.to('srgb')
		.toString({ format: 'hex' });
}

/**
 * Generates palette based on an accent color
 * The accent color is available via key 500 (in the middle),
 * the lower keys represents a lighter colors, the greater keys are darken ones.
 * @param hex accent color
 */
export function palette(hex: string) {
	const range = [
		...Color.steps('#fff', hex, { steps: 6, space: 'oklch' }),
		...Color.steps(hex, '#000', {
			steps: 5,
			space: 'oklch',
			maxDeltaE: 10,
			deltaEMethod: '2000',
		}).slice(1),
	];

	return Object.fromEntries(
		[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((key, index) => [
			key,
			range[index].toString({ format: 'hex' }),
		]),
	);
}

export function buildColorScheme(accentColor: string) {
	const accentVariants = palette(accentColor);

	return {
		accentVariants,
		getContrastForeground(background: string) {
			const backgroundColor = new Color(background);
			const options = ['#ffffff', '#000000'].sort((a, b) =>
				Math.abs(backgroundColor.contrastAPCA(a)) >
				Math.abs(backgroundColor.contrastAPCA(b))
					? -1
					: 1,
			);
			return options[0];
		},
	};
}
