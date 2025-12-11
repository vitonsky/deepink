import React, { createRef, FC, useCallback, useEffect, useState } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	Button,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Text,
	useDisclosure,
	VStack,
} from '@chakra-ui/react';
import { ENCRYPTION_ALGORITHM_OPTIONS } from '@core/features/encryption/algorithms';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
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
	isFirstProfile?: boolean;
};

export const ProfileCreator: FC<ProfileCreatorProps> = ({
	onCreateProfile,
	onCancel,
	isFirstProfile,
}) => {
	const telemetry = useTelemetryTracker();

	const profileNameInputRef = useFocusableRef<HTMLInputElement>();
	const passwordInputRef = createRef<HTMLInputElement>();

	const [isPending, setIsPending] = useState(false);

	const [profileName, setProfileName] = useState(isFirstProfile ? 'My Notes' : '');
	const [profileNameError, setProfileNameError] = useState<null | string>(null);
	useEffect(() => {
		setProfileNameError(null);
	}, [profileName]);

	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<null | string>(null);

	const [algorithm, setAlgorithm] = useState(ENCRYPTION_ALGORITHM_OPTIONS[0]);

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
			} else {
				telemetry.track(TELEMETRY_EVENT_NAME.PROFILE_CREATED, {
					encryption: usePassword ? algorithm : 'none',
				});
			}
		},
		[
			profileName,
			password,
			onCreateProfile,
			algorithm,
			profileNameInputRef,
			passwordInputRef,
			telemetry,
		],
	);

	useEffect(() => {
		if (isFirstProfile) passwordInputRef.current?.focus();
	}, []);

	const noPasswordDialogState = useDisclosure();

	return (
		<ProfilesForm
			title="Create a new profile"
			controls={
				<>
					<Button
						variant="accent"
						w="100%"
						onClick={() => onPressCreate(true)}
						disabled={isPending}
					>
						Create profile
					</Button>
					<Button
						w="100%"
						onClick={noPasswordDialogState.onOpen}
						disabled={isPending}
					>
						Continue with no password
					</Button>
					<Button w="100%" onClick={onCancel} disabled={isPending}>
						Cancel
					</Button>

					<Modal
						isOpen={noPasswordDialogState.isOpen}
						onClose={noPasswordDialogState.onClose}
						isCentered
					>
						<ModalOverlay />
						<ModalContent>
							<ModalCloseButton />
							<ModalHeader>Create profile with no encryption</ModalHeader>
							<ModalBody>
								<Text color="typography.secondary">
									All your data and notes will be stored with no
									encryption.
								</Text>
							</ModalBody>
							<ModalFooter>
								<HStack
									w="100%"
									justifyContent="end"
									as={AutoFocusInside}
								>
									<Button
										variant="accent"
										onClick={() => {
											onPressCreate(false);
											noPasswordDialogState.onClose();
										}}
									>
										Continue with no encryption
									</Button>
									<Button onClick={noPasswordDialogState.onClose}>
										Cancel
									</Button>
								</HStack>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</>
			}
		>
			<VStack w="100%" alignItems="start">
				<VStack w="100%" alignItems="start">
					<Input
						ref={profileNameInputRef}
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

				<VStack w="100%" gap="0.1rem">
					<Text fontSize="18px" alignSelf="start">
						Encryption algorithm
					</Text>
					<Select
						value={algorithm}
						onChange={(evt) => setAlgorithm(evt.target.value)}
						disabled={isPending}
					>
						{ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => (
							<option key={algorithm} value={algorithm}>
								{algorithm.split('-').join('->')}
							</option>
						))}
					</Select>
				</VStack>
			</VStack>
		</ProfilesForm>
	);
};
