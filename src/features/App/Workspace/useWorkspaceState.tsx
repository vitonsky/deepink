import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

import { ProfileControls } from '../Profile';

const WorkspaceScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
});

export const useWorkspaceState = ({
	sync,
	controls: {
		profile: {
			files,
			profile: { id: profileId },
		},
	},
	workspaceId,
}: {
	sync: boolean;
	controls: ProfileControls;
	workspaceId: string;
}) => {
	const [workspaceState] = useState(
		() =>
			new StateFile(
				new FileController(`workspaces/${workspaceId}/state.json`, files),
				WorkspaceScheme.partial(),
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
						openedNotes: state.openedNotes,
						activeNoteId: state.activeNote,
						selectedTagId: state.tags.selected,
					};
				},
			),
			onChange(state) {
				if (!state) return;

				const noteIds = state.openedNotes.map((n) => n.id);

				workspaceState.set({
					openedNoteIds: noteIds,
					activeNoteId: state.activeNoteId,
					selectedTagId: state.selectedTagId,
				});
			},
			init: false,
		});
	}, [files, profileId, sync, workspaceState, watchSelector, workspaceId]);

	return useCallback(() => workspaceState.get(), [workspaceState]);
};
