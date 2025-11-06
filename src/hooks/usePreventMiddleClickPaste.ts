import { useEffect } from 'react';

/**
 * Prevent a specific X11 bug: pressing the middle mouse button inserts data from the focused element even when clicking on another element
 */
export const usePreventMiddleClickPaste = () => {
	useEffect(() => {
		const preventTextInsert = (e: MouseEvent) => {
			if (e.button !== 1) return;
			if (
				!(
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement ||
					(e.target instanceof HTMLElement && e.target.isContentEditable)
				)
			) {
				e.preventDefault();
			}
		};

		document.addEventListener('mouseup', preventTextInsert);
		return () => document.removeEventListener('mouseup', preventTextInsert);
	}, []);
};
