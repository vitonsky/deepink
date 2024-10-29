import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, Input, Text, VStack } from '@chakra-ui/react';
import { useFocusableRef } from '@components/hooks/useFocusableRef';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { ProfilesForm } from '../ProfilesForm';
import { OnPickProfile } from '..';

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
		<ProfilesForm
			title="Unlock profile"
			controls={
				<>
					<Button
						variant="primary"
						w="100%"
						onClick={onPressLogin}
						disabled={isPending}
					>
						Unlock
					</Button>
					<Button variant="secondary" w="100%" onClick={onPickAnotherProfile}>
						Change profile
					</Button>
				</>
			}
		>
			<VStack w="100%" alignItems="start">
				<Input
					ref={firstInputRef}
					variant="filled"
					size="lg"
					type="password"
					placeholder="Enter password"
					value={secret}
					onChange={(evt) => setSecret(evt.target.value)}
					focusBorderColor={errorMessage ? 'red.500' : undefined}
					disabled={isPending}
				/>

				{errorMessage && <Text color="red.500">{errorMessage}</Text>}
			</VStack>
		</ProfilesForm>
	);
};
