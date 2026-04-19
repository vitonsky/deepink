import { useCallback, useMemo, useRef, useState } from 'react';

import { EvictingMap } from './EvictingMap';

export const useEvictingMap = <P extends unknown>() => {
	const [_, setState] = useState({});

	const mapRef = useRef(new EvictingMap<P>({ size: 100 }));
	const add = useCallback((...args: Parameters<EvictingMap<P>['add']>) => {
		mapRef.current.add(...args);
		setState({});
	}, []);

	const remove = useCallback((...args: Parameters<EvictingMap<P>['delete']>) => {
		mapRef.current.delete(...args);
		setState({});
	}, []);

	return useMemo(() => {
		const map = mapRef.current;
		return {
			add,
			delete: remove,
			size() {
				return map.size();
			},
			has(key) {
				return map.has(key);
			},
			get(key) {
				return map.get(key);
			},
			getAll() {
				return map.getAll();
			},
		} satisfies Partial<EvictingMap<P>>;
	}, [add, remove]);
};
