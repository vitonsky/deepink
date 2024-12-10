import React, { useEffect } from 'react';
import { FaArrowsRotate } from 'react-icons/fa6';
import { Box } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import styles from './profile.module.css';

export const useProfileSyncButton = () => {
	const { controls } = useStatusBarManager();

	useEffect(() => {
		controls.update(
			'sync',
			{
				visible: true,
				title: 'Sync profile data',
				text: 'Synchronization',
				icon: (
					<Box
						sx={{
							animation: `${styles.spinner} 700ms linear infinite`,
						}}
					>
						<FaArrowsRotate />
					</Box>
				),
			},
			{
				placement: 'start',
				priority: 100000,
			},
		);
	}, [controls]);
};
