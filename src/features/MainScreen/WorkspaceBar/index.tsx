import React, { useCallback, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { FaGear } from 'react-icons/fa6';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { cnMainScreen } from '@features/MainScreen';
import { WorkspaceSettings } from '@features/WorkspaceSettings/WorkspaceSettings';

export const WorkspaceBar = () => {
	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);
	}, []);

	return (
		<>
			<div className={cnMainScreen('Workspace')}>
				<Select
					className={cnMainScreen('WorkspacePicker')}
					options={[
						{
							id: 'default',
							content: 'Default',
						},
					]}
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
