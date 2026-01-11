import React, { FC, useCallback, useEffect, useId, useState } from 'react';
import { Button, Input, useToast, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { useTelemetryTracker } from '@features/telemetry';
import { useFocusableRef } from '@hooks/useFocusableRef';

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
	const telemetry = useTelemetryTracker();

	const toast = useToast();
	const toastId = 'profile-login' + useId();
	useEffect(
		() => () => {
			toast.close(toastId);
		},
		[toast, toastId],
	);

	const [secret, setSecret] = useState('');
	const [isPending, setIsPending] = useState(false);

	const [errorMessage, setErrorMessage] = useState<null | string>(null);
	useEffect(() => {
		setErrorMessage(null);
	}, [secret]);

	const onPressLogin = useCallback(async () => {
		setErrorMessage(null);
		setIsPending(true);

		const response = await onLogin(profile, secret || undefined).finally(() => {
			setIsPending(false);
		});

		if (response.status === 'error') {
			setErrorMessage(response.message ?? 'Unknown error');

			toast.close(toastId);
			requestAnimationFrame(() => {
				toast({
					id: toastId,
					status: 'error',
					title: 'Cannot open profile',
					description: response.message,
				});
			});
		}

		telemetry.track(TELEMETRY_EVENT_NAME.PROFILE_LOGIN, {
			status: response.status === 'error' ? 'error' : 'ok',
		});
	}, [onLogin, profile, secret, telemetry, toast, toastId]);

	const firstInputRef = useFocusableRef<HTMLInputElement>();
	useEffect(() => {
		if (isPending || !firstInputRef.current) return;

		firstInputRef.current.focus();
	}, [firstInputRef, isPending]);

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
			<VStack as="form" w="100%" alignItems="start" onSubmit={onPressLogin}>
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
			</VStack>
		</ProfilesForm>
	);
};
