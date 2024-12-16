import React, { FC, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Checkbox, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { ModalScreen } from '@components/ModalScreen/ModalScreen';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useProfileControls } from '@features/App/Profile';
import { useWorkspacesList } from '@features/MainScreen/WorkspaceBar/useWorkspacesList';
import { workspacePropsValidator } from '@features/MainScreen/WorkspaceBar/WorkspaceCreatePopup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';

export interface WorkspaceSettingsProps {
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ onClose }) => {
	const {
		profile: { db },
	} = useProfileControls();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const workspaceNameForm = useForm({
		defaultValues: {
			name: workspaceData?.name,
		},
		resolver: zodResolver(workspacePropsValidator),
	});

	const workspaces = useWorkspacesList();

	return (
		<ModalScreen isVisible onClose={onClose} title="Workspace settings">
			<VStack w="100%" minH="100%" p="2rem 5rem" justifyContent="center">
				<Features>
					<FeaturesOption title="Workspace name">
						<HStack
							as="form"
							onSubmit={workspaceNameForm.handleSubmit(async ({ name }) => {
								if (!workspaceData) return;

								await workspacesManager.update(workspaceData.id, {
									name,
								});

								await workspaces.update();
							})}
						>
							<Input
								{...workspaceNameForm.register('name')}
								placeholder="e.g., Personal"
								flex="100"
							/>
							<Button variant="primary" type="submit">
								Update
							</Button>
						</HStack>
						{workspaceNameForm.formState.errors.name && (
							<Text color="message.error">
								{workspaceNameForm.formState.errors.name.message}
							</Text>
						)}
					</FeaturesOption>

					<FeaturesHeader view="section">Notes management</FeaturesHeader>

					<FeaturesOption description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app">
						<HStack>
							<Button>Import notes</Button>
							<Button>Export notes</Button>
						</HStack>
					</FeaturesOption>

					<FeaturesOption description="Keep full changes log for notes. You may disable history for single notes">
						<Checkbox>Enable history for notes</Checkbox>
					</FeaturesOption>

					<FeaturesOption description="Move notes to recycle bin, instead of instant deletion">
						<Checkbox>Use recycle bin</Checkbox>
					</FeaturesOption>
				</Features>
			</VStack>
		</ModalScreen>
	);
};
