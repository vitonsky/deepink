import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';

export const useWorkspacesList = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const dispatch = useAppDispatch();

	const { profileId } = useWorkspaceData();

	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaces = useAppSelector(selectWorkspaces({ profileId }));

	const update = useCallback(async () => {
		const updatedWorkspaces = await workspacesManager.getList();

		dispatch(
			workspacesApi.updateWorkspacesList({
				profileId,
				workspaces: updatedWorkspaces,
				newNoteTemplate: t('note.title.defaultTemplate', {
					date: '{date:D MMM YYYY, HH:mm}',
				}),
			}),
		);
	}, [dispatch, profileId, t, workspacesManager]);

	return { workspaces, update };
};
