import { INote } from '@core/features/notes';

import { defaultNoteMenu, deletedNoteMenu } from '../ContextMenu';

export const getCurrentNoteMenu = (note: INote) => {
	return note.isDeleted ? deletedNoteMenu : defaultNoteMenu;
};
