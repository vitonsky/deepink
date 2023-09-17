import React, { FC, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { cn } from '@bem-react/classname';

import './WorkspaceManager.css';

export const cnWorkspaceManager = cn('WorkspaceManager');

// TODO: allow to choose algorithm
export type WorkspaceData = {
	key: string;
};

export type IWorkspacePickerProps = {
	onSubmit: (data: WorkspaceData) => void;
	errorMessage?: string | null;
};

// TODO: implement UI
/**
 * Manages a workspace profiles
 */
export const WorkspaceManager: FC<IWorkspacePickerProps> = ({
	onSubmit,
	errorMessage,
}) => {
	const [secret, setSecret] = useState('');
	return (
		<div className={cnWorkspaceManager({}, [cnTheme(theme)])}>
			<div className={cnWorkspaceManager('Container')}>
				<h3 className={cnWorkspaceManager('Header')}>Locked profile</h3>
				<Textinput
					controlProps={{
						type: 'password',
					}}
					placeholder="Enter password"
					value={secret}
					onChange={(evt) => setSecret(evt.target.value)}
					hint={errorMessage ?? undefined}
					state={errorMessage ? 'error' : undefined}
				/>
				<Button
					view="action"
					size="l"
					onClick={() => {
						onSubmit({ key: secret });
					}}
				>
					Unlock
				</Button>
			</div>
		</div>
	);
};
