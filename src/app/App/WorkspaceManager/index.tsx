import React, { FC, ReactNode, useState } from 'react';

// TODO: allow to choose algorithm
export type WorkspaceData = {
	key: string;
};

export type IWorkspacePickerProps = {
	onSubmit: (data: WorkspaceData) => void;
	errorMessage?: ReactNode | null;
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
		<div>
			<input
				type="password"
				value={secret}
				onChange={(evt) => setSecret(evt.target.value)}
			/>
			{errorMessage && <div>{errorMessage}</div>}
			<button
				onClick={() => {
					onSubmit({ key: secret });
				}}
			>
				Login
			</button>
		</div>
	);
};
