import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaDice } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	Button,
	HStack,
	Input,
	InputGroup,
	InputRightElement,
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
import { IconButton } from '@components/IconButton';
import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { ENCRYPTION_ALGORITHM_OPTIONS } from '@core/features/encryption/algorithms';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { shuffleArray } from '@utils/collections/shuffleArray';

import { ProfilesForm } from '../ProfilesForm';

export type NewProfile = {
	name: string;
	password: string | null;
	algorithm: string;
};

export type ProfileCreatorProps = {
	onCreateProfile: (profile: NewProfile) => Promise<void | string>;
	onCancel?: () => void;
	defaultProfileName?: string;
};

export const ProfileCreator: FC<ProfileCreatorProps> = ({
	onCreateProfile,
	onCancel,
	defaultProfileName,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);

	const telemetry = useTelemetryTracker();

	const profileNameInputRef = useRef<HTMLInputElement | null>(null);
	const passwordInputRef = useRef<HTMLInputElement | null>(null);

	const [isPending, setIsPending] = useState(false);

	const [profileName, setProfileName] = useState(defaultProfileName ?? '');
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
				setProfileNameError(t('creator.errors.nameRequired'));
				profileNameInputRef.current?.focus();
				return;
			}

			if (usePassword && !password) {
				setPasswordError(t('creator.errors.passwordRequired'));
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
			t,
			telemetry,
		],
	);

	// Set focus to the input
	useEffect(() => {
		const hasProfileName = profileNameInputRef.current?.value;
		if (!hasProfileName) {
			profileNameInputRef.current?.focus();
			return;
		}

		passwordInputRef.current?.focus();
	}, []);

	const noPasswordDialogState = useDisclosure();

	return (
		<ProfilesForm
			title={t('creator.title')}
			controls={
				<>
					<Button
						variant="accent"
						w="100%"
						onClick={() => onPressCreate(true)}
						disabled={isPending}
					>
						{t('creator.actions.create')}
					</Button>
					<Button
						w="100%"
						onClick={noPasswordDialogState.onOpen}
						disabled={isPending}
					>
						{t('creator.actions.continueNoPassword')}
					</Button>
					{onCancel && (
						<Button w="100%" onClick={onCancel} disabled={isPending}>
							{t('creator.actions.cancel')}
						</Button>
					)}

					<Modal
						isOpen={noPasswordDialogState.isOpen}
						onClose={noPasswordDialogState.onClose}
						isCentered
					>
						<ModalOverlay />
						<ModalContent>
							<ModalCloseButton />
							<ModalHeader>
								{t('creator.noEncryptionDialog.title')}
							</ModalHeader>
							<ModalBody>
								<Text color="typography.secondary">
									{t('creator.noEncryptionDialog.description')}
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
										{t('creator.noEncryptionDialog.actions.confirm')}
									</Button>
									<Button onClick={noPasswordDialogState.onClose}>
										{t('creator.noEncryptionDialog.actions.cancel')}
									</Button>
								</HStack>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</>
			}
		>
			<VStack
				w="100%"
				alignItems="start"
				gap="1.5rem"
				fontSize="18px"
				color="typography.additional"
			>
				<VStack as="label" w="100%" alignItems="start">
					<Text>{t('creator.field.name.label')}</Text>

					<InputGroup size="md">
						<Input
							ref={profileNameInputRef}
							placeholder={t('creator.field.name.placeholder')}
							value={profileName}
							onChange={(evt) => setProfileName(evt.target.value)}
							focusBorderColor={profileNameError ? 'red.500' : undefined}
							disabled={isPending}
						/>
						<InputRightElement>
							<IconButton
								icon={<FaDice />}
								title="Generate random"
								onClick={(evt) => {
									evt.preventDefault();

									const suggestedName = shuffleArray(
										t('creator.field.name.suggests', {
											returnObjects: true,
										}) as string[],
									).find((name) => name !== profileName);

									if (suggestedName) setProfileName(suggestedName);
									profileNameInputRef.current?.focus();
								}}
							/>
						</InputRightElement>
					</InputGroup>

					{profileNameError && <Text color="red.500">{profileNameError}</Text>}
				</VStack>
				<VStack w="100%" alignItems="start">
					<HStack>
						<Text>{t('creator.field.password.label')}</Text>
						<Text variant="secondary">
							{t('creator.field.password.recommended')}
						</Text>
					</HStack>
					<Input
						ref={passwordInputRef}
						size="md"
						type="password"
						placeholder={t('creator.field.password.placeholder')}
						value={password}
						onChange={(evt) => setPassword(evt.target.value)}
						focusBorderColor={passwordError ? 'red.500' : undefined}
						disabled={isPending}
					/>

					{passwordError && <Text color="red.500">{passwordError}</Text>}
				</VStack>

				<VStack w="100%" gap="0.1rem">
					<Text fontSize="18px" alignSelf="start">
						{t('creator.field.algorithm.label')}
					</Text>
					<Select
						size="md"
						value={algorithm}
						onChange={(evt) =>
							setAlgorithm(evt.target.value as ENCRYPTION_ALGORITHM)
						}
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
