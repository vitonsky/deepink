import React, { createRef, FC, useCallback, useEffect, useState } from 'react';
import { Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import {
	ENCRYPTION_ALGORITHM,
	EncryptionAlgorithm,
} from '@core/features/encryption/algorithms';
import { useFocusableRef } from '@hooks/useFocusableRef';

import { ProfilesForm } from '../ProfilesForm';

export type NewProfile = {
	name: string;
	password: string | null;
	algorithm: EncryptionAlgorithm;
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

	const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>(
		ENCRYPTION_ALGORITHM.AES,
	);

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
				algorithm: algorithm,
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
						<Text
							alignSelf={'start'}
							color={'typography.additional'}
							fontSize={'14px'}
						>
							Insecure: your data will not be encrypted
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
					<Text
						minW={'max-content'}
						color="typography.additional"
						fontSize="18px"
					>
						Encryption algorithm
					</Text>
					<Select
						variant="secondary"
						defaultValue="aes"
						onChange={(evt) =>
							setAlgorithm(evt.target.value as EncryptionAlgorithm)
						}
						disabled={isPending}
					>
						{[
							{
								value: ENCRYPTION_ALGORITHM.AES,
								text: 'AES',
							},
							{
								value: ENCRYPTION_ALGORITHM.TWOFISH,
								text: 'Twofish',
							},
							{
								value: ENCRYPTION_ALGORITHM.AES_TWOFISH,
								text: 'AES - Twofish',
							},
							{
								value: ENCRYPTION_ALGORITHM.TWOFISH_AES,
								text: 'Twofish - AES',
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
