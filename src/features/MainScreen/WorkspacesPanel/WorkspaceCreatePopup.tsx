import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { z, ZodError } from 'zod';
import {
	Button,
	HStack,
	Input,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	Text,
	VStack,
} from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { useTelemetryTracker } from '@features/telemetry';
import { useModalApi } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { useWorkspacesList } from './useWorkspacesList';

export const workspaceNameValidator = z.object({
	name: z.string().trim().min(1, 'Name must not be empty'),
});

export const WorkspaceCreatePopup = () => {
	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();

	const { onClose } = useModalApi();

	const { profileId } = useWorkspaceData();

	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const { update: updateWorkspaces } = useWorkspacesList();

	const inputNameRef = useRef<HTMLInputElement | null>(null);

	const [workspaceName, setWorkspaceName] = useState<string>('');
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onCreate = useCallback(async () => {
		if (isPending) return;
		setErrorMessage('');
		setIsPending(true);

		try {
			const { name: validatedName } = workspaceNameValidator.parse({
				name: workspaceName,
			});

			const workspaceId = await workspacesManager.create({ name: validatedName });

			// Synchronize immediately after creation to prevent workspace loss
			// if the user closes the app before the automatic sync
			await db.sync();

			await updateWorkspaces();
			dispatch(workspacesApi.setActiveWorkspace({ workspaceId, profileId }));

			telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_ADDED);

			onClose();
		} catch (error) {
			console.error(error);
			const message =
				error instanceof ZodError
					? error.issues[0].message
					: 'Unable to save the workspace. Please try again.';

			setErrorMessage(message);

			inputNameRef.current?.focus();
		} finally {
			setIsPending(false);
		}
	}, [
		isPending,
		workspaceName,
		workspacesManager,
		db,
		updateWorkspaces,
		dispatch,
		profileId,
		telemetry,
		onClose,
	]);

	return (
		<>
			<ModalCloseButton />
			<ModalHeader>
				<Text>Add new workspace</Text>
			</ModalHeader>
			<ModalBody paddingBottom="1rem">
				<VStack
					as="form"
					w="100%"
					gap="2rem"
					align="start"
					onSubmit={(e) => {
						e.preventDefault();
						onCreate();
					}}
				>
					<Text color="typography.secondary">
						Create a new workspace to manage your notes even better. Separate
						your notes by scope.
					</Text>

					<VStack as={AutoFocusInside} gap="1.5rem" w="100%" minW="350px">
						<VStack as="label" align="start" w="100%" gap="0.3rem">
							<Text paddingBottom=".2rem">Workspace name</Text>
							<Input
								ref={inputNameRef}
								value={workspaceName}
								onChange={(evt) => {
									setWorkspaceName(evt.target.value);
									setErrorMessage(null);
								}}
								placeholder="e.g., Personal"
								isDisabled={isPending}
							/>
							{errorMessage && (
								<Text color="message.error">{errorMessage}</Text>
							)}
						</VStack>

						<HStack w="100%" justifyContent="end">
							<Button type="submit" variant="accent" isDisabled={isPending}>
								Add
							</Button>

							<Button onClick={onClose} isDisabled={isPending}>
								Cancel
							</Button>
						</HStack>
					</VStack>
				</VStack>
			</ModalBody>
		</>
	);
};
