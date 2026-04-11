import { ReactNode, useEffect } from 'react';
import {
	ReactVirtualizerOptions,
	useVirtualizer,
	Virtualizer,
} from '@tanstack/react-virtual';

export const VirtualList = ({
	children,
	activeIndex,
	...props
}: Partial<ReactVirtualizerOptions<HTMLDivElement, HTMLLIElement>> &
	Pick<
		ReactVirtualizerOptions<HTMLDivElement, HTMLLIElement>,
		'count' | 'getScrollElement' | 'estimateSize'
	> & {
		children: (virtualizer: Virtualizer<HTMLDivElement, HTMLLIElement>) => ReactNode;
		activeIndex?: number;
	}) => {
	// FIXME: https://github.com/TanStack/virtual/issues/1119
	// eslint-disable-next-line react-hooks/incompatible-library
	const virtualizer = useVirtualizer(props);

	useEffect(() => {
		if (activeIndex === undefined) return;

		virtualizer.scrollToIndex(activeIndex);
	}, [activeIndex, virtualizer]);

	return children(virtualizer);
};
