import React, { FC } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { CenterBox } from './CenterBox';
import { ProfilesForm } from './ProfilesForm';
import { OnPickProfile } from './types';

export const ChooseVaultScreen: FC<{
	vaults: ProfileObject[];
	onOpenVault: OnPickProfile;
	onCreateVault: () => void;
}> = ({ vaults, onOpenVault, onCreateVault }) => {
	const dispatch = useAppDispatch();

	return (
		<CenterBox>
			<ProfilesForm
				title="Choose the profile"
				controls={
					<Button
						variant="accent"
						size="lg"
						w="100%"
						onClick={() => onCreateVault()}
					>
						Create new profile
					</Button>
				}
			>
				<NestedList
					divider={<Divider margin="0px !important" />}
					sx={{
						w: '100%',
						borderRadius: '4px',
						maxHeight: '230px',
						overflow: 'auto',
						border: '1px solid',
					}}
					items={(vaults ?? []).map((vault) => ({
						id: vault.id,
						content: (
							<HStack
								as="button"
								key={vault.id}
								sx={{
									padding: '.8rem 1rem',
									w: '100%',
									cursor: 'pointer',
									gap: '.8rem',
								}}
								onClick={() => {
									dispatch(workspacesApi.setActiveProfile(vault.id));

									if (vault.encryption === null) {
										onOpenVault(vault);
									}

									telemetry.track(
										TELEMETRY_EVENT_NAME.PROFILE_SELECTED,
									);
								}}
							>
								<FaUser />
								<Text>{vault.name}</Text>
							</HStack>
						),
					}))}
				/>
			</ProfilesForm>
		</CenterBox>
	);
};
