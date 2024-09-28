import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, Input, Text, VStack } from '@chakra-ui/react';
import { useFocusableRef } from '@components/hooks/useFocusableRef';

import { ProfilesForm } from '..';

export type NewProfile = {
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
		<ProfilesForm
			title="Create a new profile"
			controls={
				<>
					<Button
						colorScheme="primary"
						w="100%"
						onClick={() => onPressCreate(true)}
						disabled={isPending}
					>
						Create profile
					</Button>
					<Button
						variant="primary"
						w="100%"
						onClick={() => onPressCreate(false)}
						disabled={isPending}
					>
						Continue with no password
					</Button>
					<Button
						variant="primary"
						w="100%"
						onClick={onCancel}
						disabled={isPending}
					>
						Cancel
					</Button>
				</>
			}
		>
			<VStack w="100%" alignItems="start">
				<VStack w="100%" alignItems="start">
					<Input
						ref={firstInputRef}
						placeholder="Profile name"
						value={profileName}
						onChange={(evt) => setProfileName(evt.target.value)}
						focusBorderColor={profileNameError ? 'red.500' : undefined}
						disabled={isPending}
					/>

					{profileNameError && <Text color="red.500">{profileNameError}</Text>}
				</VStack>

				<VStack w="100%" alignItems="start">
					<Input
						type="password"
						placeholder="Enter password"
						value={password}
						onChange={(evt) => setPassword(evt.target.value)}
						focusBorderColor={passwordError ? 'red.500' : undefined}
						disabled={isPending}
					/>

					{passwordError && <Text color="red.500">{passwordError}</Text>}
				</VStack>
			</VStack>
		</ProfilesForm>
	);
};
