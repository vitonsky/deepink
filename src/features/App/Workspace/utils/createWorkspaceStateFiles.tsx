import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { RootedFS } from '@core/features/files/RootedFS';
import { StateFile } from '@core/features/files/StateFile';
import { NOTES_VIEW, WorkspaceConfigScheme } from '@state/redux/profiles/profiles';

export const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
	view: z.enum(NOTES_VIEW),
	search: z.string(),
});

export const createWorkspaceStateFiles = (storage: RootedFS) => ({
	workspaceConfig: new StateFile(
		new FileController(`config.json`, storage),
		WorkspaceConfigScheme,
	),
	workspaceState: new StateFile(
		new FileController(`state.json`, storage),
		WorkspaceStateScheme,
	),
});
