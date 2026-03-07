import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

import { ProfileControls } from '../Profile';

const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
	view: z.string().nullable(),
	search: z.string().nullable(),
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
			init: false,
		});
	}, [profileId, sync, workspaceState, watchSelector, workspaceId]);

	return useCallback(() => workspaceState.get(), [workspaceState]);
};
