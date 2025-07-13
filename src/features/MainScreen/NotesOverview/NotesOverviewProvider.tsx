import React, { createContext, FC, PropsWithChildren, useState } from 'react';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const NOTES_OVERVIEW_OPTIONS = {
	ALL: 'all',
	BIN: 'bin',
} as const;

export type NotesOverviewOption =
	(typeof NOTES_OVERVIEW_OPTIONS)[keyof typeof NOTES_OVERVIEW_OPTIONS];

type NotesOverviewContextType = {
	noteOverview: NotesOverviewOption | null;
	setNoteOverview: (options: NotesOverviewOption | null) => void;
};

const NotesOverviewContext = createContext<NotesOverviewContextType | null>(null);
export const useNotesOverview = createContextGetterHook(NotesOverviewContext);

export const NotesOverviewProvider: FC<PropsWithChildren> = ({ children }) => {
	const [noteOverview, setNoteOverview] = useState<NotesOverviewOption | null>(null);

	return (
		<NotesOverviewContext.Provider
			value={{
				noteOverview,
				setNoteOverview,
			}}
		>
			{children}
		</NotesOverviewContext.Provider>
	);
};
