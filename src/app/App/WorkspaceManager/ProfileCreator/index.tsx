import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

import { useFocusableRef } from '../../../components/hooks/useFocusableRef';

import { cnWorkspaceManager } from '..';

type NewProfile = {
	name: string;
	password: string | null;
};

export type ProfileCreatorProps = {
	onCreateProfile: (profile: NewProfile) => Promise<void | string>;
	onCancel: () => void;
};

export const ProfileCreator: FC<ProfileCreatorProps> = ({
	onCreateProfile,
	onCancel,
}) => {
	const [isPending, setIsPending] = useState(false);

	const [profileName, setProfileName] = useState('');
	const [profileNameError, setProfileNameError] = useState<null | string>(null);
	useEffect(() => {
		setProfileNameError(null);
	}, [profileName]);

	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<null | string>(null);
	useEffect(() => {
		setPasswordError(null);
	}, [password]);

	const onPressCreate = useCallback(
		async (usePassword = true) => {
			if (!profileName) {
				setProfileNameError('Enter profile name');
				return;
			}

			if (usePassword && !password) {
				setPasswordError('Enter the password');
				return;
			}

			setIsPending(true);
			setProfileNameError(null);
			setPasswordError(null);

			const response = await onCreateProfile({
				name: profileName,
				password: usePassword ? password : null,
			}).finally(() => {
				setIsPending(false);
			});

			if (response !== undefined) {
				setProfileNameError(response);
			}
		},
		[onCreateProfile, password, profileName],
	);

	const firstInputRef = useFocusableRef<HTMLInputElement>();

	return (
		<div className={cnWorkspaceManager('Container')}>
			<h3 className={cnWorkspaceManager('Header')}>Create a new profile</h3>
			<Textinput
				placeholder="Profile name"
				value={profileName}
				onChange={(evt) => setProfileName(evt.target.value)}
				hint={profileNameError ?? undefined}
				state={profileNameError ? 'error' : undefined}
				disabled={isPending}
				controlProps={{ innerRef: firstInputRef }}
			/>
			<Textinput
				controlProps={{
					type: 'password',
				}}
				placeholder="Enter password"
				value={password}
				onChange={(evt) => setPassword(evt.target.value)}
				hint={passwordError ?? undefined}
				state={passwordError ? 'error' : undefined}
				disabled={isPending}
			/>
			<Button
				view="action"
				size="l"
				onClick={() => onPressCreate(true)}
				disabled={isPending}
			>
				Create profile
			</Button>
			<Button
				view="default"
				size="l"
				onClick={() => onPressCreate(false)}
				disabled={isPending}
			>
				Continue with no password
			</Button>
			<Button view="default" size="l" onClick={onCancel} disabled={isPending}>
				Cancel
			</Button>
		</div>
	);
};
