export const joinCallbacks =
	(...callbacks: Array<() => void>) =>
	() => {
		callbacks.forEach((cb) => cb());
	};
