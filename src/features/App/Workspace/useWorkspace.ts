import { useEffect, useState } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { BookmarksController } from '@core/features/notes/controller/BookmarksController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { ElectronFilesController, storageApi } from '@electron/requests/storage/renderer';
import { useWorkspaceData } from '@state/redux/profiles/hooks';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
	notesHistory: NoteVersions;
	bookmarksRegistry: BookmarksController;
};

export const useWorkspace = (currentProfile: ProfileContainer) => {
	const [state, setState] = useState<WorkspaceContainer | null>(null);

	const { workspaceId } = useWorkspaceData();

	useEffect(() => {
		const { db, profile, encryptionController } = currentProfile;

		// Setup files
		// TODO: implement methods to close the objects after use
		const filesController = new ElectronFilesController(
			storageApi,
			[profile.id, 'files'].join('/'),
			encryptionController,
		);
		setState({
			filesController,
			attachmentsController: new AttachmentsController(db, workspaceId),
			filesRegistry: new FilesController(db, filesController, workspaceId),
			tagsRegistry: new TagsController(db, workspaceId),
			notesRegistry: new NotesController(db, workspaceId),
			notesHistory: new NoteVersions(db, workspaceId),
			bookmarksRegistry: new BookmarksController(db, workspaceId),
		});
	}, [currentProfile, workspaceId]);

	return state;
};
