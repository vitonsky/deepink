import React, { createRef, FC, useCallback, useEffect, useState } from 'react';
import { Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import { useFocusableRef } from '@hooks/useFocusableRef';

import { ProfilesForm } from '../ProfilesForm';

export type NewProfile = {
	name: string;
	password: string | null;
	algorithm: string;
};

export type ProfileCreatorProps = {
	onCreateProfile: (profile: NewProfile) => Promise<void | string>;
	onCancel: () => void;
};

export const ProfileCreator: FC<ProfileCreatorProps> = ({
	onCreateProfile,
	onCancel,
}) => {
	const profileNameInputRef = useFocusableRef<HTMLInputElement>();
	const passwordInputRef = createRef<HTMLInputElement>();

	const [isPending, setIsPending] = useState(false);

	const [profileName, setProfileName] = useState('');
	const [profileNameError, setProfileNameError] = useState<null | string>(null);
	useEffect(() => {
		setProfileNameError(null);
	}, [profileName]);

	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<null | string>(null);

	const [algorithm, setAlgorithm] = useState('aes');

	useEffect(() => {
		setPasswordError(null);
	}, [password]);

	const onPressCreate = useCallback(
		async (usePassword = true) => {
			if (!profileName) {
				setProfileNameError('Enter profile name');
				profileNameInputRef.current?.focus();
				return;
			}

			if (usePassword && !password) {
				setPasswordError('Enter the password');
				passwordInputRef.current?.focus();
				return;
			}

			setIsPending(true);
			setProfileNameError(null);
			setPasswordError(null);

			const response = await onCreateProfile({
				name: profileName,
				password: usePassword ? password : null,
				algorithm,
			}).finally(() => {
				setIsPending(false);
			});

			if (response !== undefined) {
				setProfileNameError(response);
			}
		},
		[
			onCreateProfile,
			password,
			passwordInputRef,
			profileName,
			profileNameInputRef,
			algorithm,
		],
	);

	return (
		<ProfilesForm
			title="Create a new profile"
			controls={
				<>
					<Button
						variant="primary"
						w="100%"
						onClick={() => onPressCreate(true)}
						disabled={isPending}
					>
						Create profile
					</Button>
					<VStack w="100%" gap={'0rem'}>
						<Button
							variant="secondary"
							w="100%"
							onClick={() => onPressCreate(false)}
							disabled={isPending}
						>
							Continue with no encryption
						</Button>
						<Text color={'typography.additional'} fontSize={'15px'}>
							Your data will not be encrypted, which may be insecure
						</Text>
					</VStack>
					<Button
						variant="secondary"
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
						ref={profileNameInputRef}
						variant="filled"
						size="lg"
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
						ref={passwordInputRef}
						variant="filled"
						size="lg"
						type="password"
						placeholder="Enter password"
						value={password}
						onChange={(evt) => setPassword(evt.target.value)}
						focusBorderColor={passwordError ? 'red.500' : undefined}
						disabled={isPending}
					/>

					{passwordError && <Text color="red.500">{passwordError}</Text>}
				</VStack>

				<HStack w="100%">
					<Text flex="3" color="typography.secondary" fontSize="18px">
						Encryption algorithm
					</Text>
					<Select
						flex="3"
						variant="secondary"
						defaultValue="aes"
						onChange={(evt) => setAlgorithm(evt.target.value)}
						disabled={isPending}
					>
						{[
							{
								value: 'aes',
								text: 'AES',
							},
							{
								value: 'twofish',
								text: 'Twofish',
							},
							{
								value: 'both',
								text: 'AES-Twofish',
							},
						].map(({ value, text }) => (
							<option key={value} value={value}>
								{text}
							</option>
						))}
					</Select>
				</HStack>
			</VStack>
		</ProfilesForm>
	);
};
