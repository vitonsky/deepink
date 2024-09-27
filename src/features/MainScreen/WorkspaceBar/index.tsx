import React, { useCallback, useMemo, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { FaGear } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { cnMainScreen } from '@features/MainScreen';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspaces } from '@state/redux/profiles/profiles';

export const WorkspaceBar = () => {
	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);
	}, []);

	const { profileId } = useWorkspaceData();

	const selectWorkspacesWithMemo = useMemo(
		() =>
			createSelector([selectWorkspaces({ profileId })], (workspaces) =>
				workspaces.map((workspace) => ({
					id: workspace.id,
					content: workspace.name,
				})),
			),
		[profileId],
	);
	const workspaces = useAppSelector(selectWorkspacesWithMemo);

	return (
		<>
			<div className={cnMainScreen('Workspace')}>
				<Select
					className={cnMainScreen('WorkspacePicker')}
					options={workspaces}
					value="default"
				></Select>
				<Button title="Workspace settings" onPress={editWorkspace}>
					<Icon boxSize="1rem" hasGlyph>
						<FaGear size="100%" />
					</Icon>
				</Button>
			</div>

			<WorkspaceSettings
				isVisible={isWorkspaceEditing}
				onClose={() => setIsWorkspaceEditing(false)}
			/>
		</>
	);
};
