import React, { FC } from 'react';
import { Button, Checkbox, HStack, Input, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { ModalScreen } from '@components/ModalScreen/ModalScreen';

export interface WorkspaceSettingsProps {
	isVisible?: boolean;
	onClose?: () => void;
}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({ isVisible, onClose }) => {
	return (
		<ModalScreen isVisible={isVisible} onClose={onClose} title="Workspace settings">
			<VStack w="100%" minH="100%" p="2rem 5rem" justifyContent="center">
				<Features>
					<FeaturesOption title="Workspace name">
						<HStack>
							<Input
								placeholder="Enter workspace name"
								defaultValue="Default"
								flex="100"
							/>
							<Button variant="primary" disabled>
								Update
							</Button>
						</HStack>
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
