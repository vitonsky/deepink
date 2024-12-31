export function isElementInViewport(node: HTMLElement) {
	// eslint-disable-next-line spellcheck/spell-checker
	const rect = node.getBoundingClientRect();

	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}
