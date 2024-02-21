import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { useFocusableRef } from '@components/hooks/useFocusableRef';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { cnWorkspaceManager, OnPickProfile } from '..';

export type ProfileLoginFormProps = {
	profile: ProfileObject;
	onLogin: OnPickProfile;
	onPickAnotherProfile: () => void;
};

export const ProfileLoginForm: FC<ProfileLoginFormProps> = ({
	profile,
	onLogin,
	onPickAnotherProfile,
}) => {
	const [secret, setSecret] = useState('');
	const [isPending, setIsPending] = useState(false);

	const [errorMessage, setErrorMessage] = useState<null | string>(null);
	useEffect(() => {
		setErrorMessage(null);
	}, [secret]);

	const onPressLogin = useCallback(async () => {
		setErrorMessage(null);
		setIsPending(true);

		const response = await onLogin(profile.id, secret || undefined).finally(() => {
			setIsPending(false);
		});

		if (response.status === 'error') {
			setErrorMessage(response.message ?? 'Unknown error');
		}
	}, [onLogin, profile.id, secret]);

	const firstInputRef = useFocusableRef<HTMLInputElement>();

	return (
		<div className={cnWorkspaceManager('Container')}>
			<h3 className={cnWorkspaceManager('Header')}>Unlock profile</h3>
			<Textinput
				controlProps={{
					type: 'password',
					innerRef: firstInputRef,
				}}
				placeholder="Enter password"
				value={secret}
				onChange={(evt) => setSecret(evt.target.value)}
				hint={errorMessage ?? undefined}
				state={errorMessage ? 'error' : undefined}
				disabled={isPending}
			/>
			<Button view="action" size="l" onClick={onPressLogin} disabled={isPending}>
				Unlock
			</Button>
			<Button view="default" size="l" onClick={onPickAnotherProfile}>
				Change profile
			</Button>
		</div>
	);
};
