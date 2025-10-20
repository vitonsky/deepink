import { LexicalEditor } from 'lexical';

/**
 * Register mutation observer on root node when node is mount.
 * This util handle case if root node will be replaced.
 *
 * @param editor editor instance
 * @param callback will be called when mutation occurs
 * @param options MutationObserverInit
 * @returns cleanup function to unsubscribe the callback
 */
export const registerMutationObserver = (
	editor: LexicalEditor,
	callback: (mutations: MutationRecord[]) => void,
	options: MutationObserverInit = {},
) => {
	let activeObserver: MutationObserver | null = null;

	const unsubscribe = editor.registerRootListener((root) => {
		// Disconnect previous instance
		if (activeObserver) {
			activeObserver.disconnect();
			activeObserver = null;
		}

		if (root) {
			const mutationObserver = new MutationObserver((mutations) =>
				callback(mutations),
			);
			mutationObserver.observe(root, {
				attributes: true,
				childList: true,
				subtree: true,
				characterData: true,
				...options,
			});

			activeObserver = mutationObserver;
		}
	});

	// Cleanup
	return () => {
		unsubscribe();

		if (activeObserver) {
			activeObserver.disconnect();
			activeObserver = null;
		}
	};
};
