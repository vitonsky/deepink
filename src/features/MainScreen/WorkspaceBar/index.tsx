import React, { useCallback, useMemo, useState } from 'react';
import { FaGear } from 'react-icons/fa6';
import { createSelector } from 'reselect';
import { Button, Select } from '@chakra-ui/react';
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
				<Select variant="secondary" value="default">
					{workspaces.map((workspace) => (
						<option key={workspace.id} value={workspace.id}>
							{workspace.content}
						</option>
					))}
				</Select>
				<Button
					variant="secondary"
					title="Workspace settings"
					onClick={editWorkspace}
				>
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
