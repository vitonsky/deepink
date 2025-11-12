import { useCallback,useEffect, useState } from 'react';
import { INote } from '@core/features/notes';

export const useNoteLazyLoad = (
	updateNotes: (page?: number, oldNotes?: INote[]) => Promise<void>,
) => {
	const [page, setPage] = useState<number | undefined>(undefined);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setPage(undefined);
	}, [updateNotes]);

	const loadMore = useCallback(
		async (oldNotes: INote[]) => {
			if (loading) return;
			setLoading(true);

			await updateNotes(page, oldNotes);

			setPage((prev) => (prev === undefined ? 1 : prev + 1));
			setLoading(false);
		},
		[page, updateNotes, loading],
	);

	return loadMore;
};
