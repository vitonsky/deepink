import React, { FC } from 'react';
import { Box } from '@chakra-ui/react';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { ProfilesApi } from './Profiles/hooks/useProfileContainers';

export const VaultScreen: FC<{ vaultContainers: ProfilesApi }> = ({
	vaultContainers,
}) => {
	return (
		<Box
			sx={{
				display: 'flex',
				width: '100%',
				height: '100vh',
			}}
		>
			<Profiles profilesApi={vaultContainers} />
			<AppServices />
		</Box>
	);
};
