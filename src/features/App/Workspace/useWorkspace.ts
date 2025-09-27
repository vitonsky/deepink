import { useEffect, useState } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { useWorkspaceData } from '@state/redux/profiles/hooks';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
	notesHistory: NoteVersions;
};

export const useWorkspace = (currentProfile: ProfileContainer) => {
	const [state, setState] = useState<WorkspaceContainer | null>(null);

	const { workspaceId } = useWorkspaceData();

	useEffect(() => {
		const { db, profile, encryptionController } = currentProfile;

		// Setup files
		// TODO: implement methods to close the objects after use
		const attachmentsController = new AttachmentsController(db, workspaceId);
		const filesController = new ElectronFilesController(
			[profile.id, 'files', workspaceId].join('/'),
			encryptionController,
		);
		const filesRegistry = new FilesController(
			db,
			filesController,
			attachmentsController,
			workspaceId,
		);
		setState({
			attachmentsController,
			filesController,
			filesRegistry,
			tagsRegistry: new TagsController(db, workspaceId),
			notesRegistry: new NotesController(db, workspaceId),
			notesHistory: new NoteVersions(db, workspaceId),
		});
	}, [currentProfile, workspaceId]);

	return state;
};
