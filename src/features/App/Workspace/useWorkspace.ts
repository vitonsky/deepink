import { useEffect, useState } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { ElectronFilesController } from '@electron/requests/storage/renderer';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
};

export const useWorkspace = (currentProfile: ProfileContainer) => {
	const [state, setState] = useState<WorkspaceContainer | null>(null);

	useEffect(() => {
		const { db, profile, encryptionController } = currentProfile;

		// TODO: replace to workspace ID
		const workspaceId = 'fake-id';

		// Setup files
		// TODO: implement methods to close the objects after use
		const attachmentsController = new AttachmentsController(db, workspaceId);
		const filesController = new ElectronFilesController(
			[profile.id, 'files'].join('/'),
			encryptionController,
		);
		const filesRegistry = new FilesController(
			db,
			filesController,
			attachmentsController,
			workspaceId,
		);
		const tagsRegistry = new TagsController(db, workspaceId);
		const notesRegistry = new NotesController(db, workspaceId);

		setState({
			attachmentsController,
			filesController,
			filesRegistry,
			tagsRegistry,
			notesRegistry,
		});
	}, [currentProfile]);

	return state;
};
