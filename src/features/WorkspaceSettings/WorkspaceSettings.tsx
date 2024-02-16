import React, { FC } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cn } from '@bem-react/classname';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { Stack } from '@components/Stack/Stack';

import { ModalScreen } from '../ModalScreen/ModalScreen';

import './WorkspaceSettings.css';

export const cnWorkspaceSettings = cn('WorkspaceSettings');

export interface WorkspaceSettingsProps {
	isVisible?: boolean;
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ isVisible, onClose }) => {
	return (
		<ModalScreen
			isVisible={isVisible}
			onClose={onClose}
			className={cnWorkspaceSettings()}
			title="Workspace settings"
		>
			<div className={cnWorkspaceSettings('Body')}>
				<Features>
					<FeaturesOption title="Workspace name">
						<Stack direction="horizontal">
							<Textinput
								placeholder="Enter workspace name"
								value="Default"
							/>
							<Button view="action" disabled>
								Update
							</Button>
						</Stack>
					</FeaturesOption>

					<FeaturesHeader view="section">Notes management</FeaturesHeader>

					<FeaturesOption description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app">
						<Stack direction="horizontal" spacing={2}>
							<Button>Import notes</Button>
							<Button>Export notes</Button>
						</Stack>
					</FeaturesOption>

					<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
						<Checkbox label="Enable history for notes" />
					</FeaturesOption>

					<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
						<Checkbox label="Use recycle bin" />
					</FeaturesOption>
				</Features>
			</div>
		</ModalScreen>
	);
};
