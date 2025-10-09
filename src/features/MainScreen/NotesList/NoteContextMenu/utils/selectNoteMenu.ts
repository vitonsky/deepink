import { INote } from '@core/features/notes';

import { defaultNoteMenu, deletedNoteMenu } from '../noteMenus';

export const selectNoteMenu = (note: INote) => {
	return note.isDeleted ? deletedNoteMenu : defaultNoteMenu;
};
