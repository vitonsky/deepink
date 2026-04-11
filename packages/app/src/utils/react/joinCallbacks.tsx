export const joinCallbacks =
	(...callbacks: (() => void)[]) =>
	() => {
		callbacks.forEach((cb) => cb());
	};
