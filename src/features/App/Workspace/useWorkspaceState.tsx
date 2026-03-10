import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { NOTES_VIEW, selectWorkspace } from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
	view: z.enum(NOTES_VIEW).nullable(),
	search: z.string().nullable(),
});

export const useWorkspaceState = ({
	sync,
	profileId,

	workspaceId,
}: {
	sync: boolean;
	profileId: string;
	workspaceId: string;
}) => {
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceId));
	const [workspaceState] = useState(
		() =>
			new StateFile(
				new FileController(`state.json`, workspaceFiles),

				// Use Partial because the state includes only the properties the user has interacted with,
				// so some fields might be missing
				WorkspaceStateScheme.partial(),
			),
	);

	const watchSelector = useWatchSelector();
	useEffect(() => {
		if (!sync) return;

		return watchSelector({
			selector: createAppSelector(
				selectWorkspace({ profileId, workspaceId }),
				(state) => {
					if (!state) return null;

					return {
						openedNoteIds: state.openedNotes.map((n) => n.id),
						activeNoteId: state.activeNote,
						selectedTagId: state.tags.selected,
						view: state.view,
						search: state.search,
					};
				},
			),
			onChange(state) {
				if (!state) return;

				workspaceState.set(state);
			},
		});
	}, [profileId, sync, workspaceState, watchSelector, workspaceId]);

	return useCallback(() => workspaceState.get(), [workspaceState]);
};
