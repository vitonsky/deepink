import { Plausible } from 'plausible-client';

export const enableClickTracking = (plausible: Plausible) => {
	if (typeof window === 'undefined') return;

	const onClick = (evt: MouseEvent) => {
		console.log('Trace', evt.composedPath());
		const linkElement = evt
			.composedPath()
			.find((node) => node instanceof HTMLAnchorElement);
		if (!linkElement) return;

		plausible.sendEvent('Link click', {
			props: { url: linkElement.href, text: linkElement.innerText.trim() },
		});
	};

	window.addEventListener('click', onClick);
	return () => {
		window.removeEventListener('click', onClick);
	};
};
