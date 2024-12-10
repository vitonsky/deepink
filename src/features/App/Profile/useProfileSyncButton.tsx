import React, { useCallback, useEffect } from 'react';
import { FaArrowsRotate } from 'react-icons/fa6';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { useProfileControls } from '.';

import styles from './profile.module.css';

export const useProfileSyncButton = () => {
	const { controls } = useStatusBarManager();

	const [isPending, setIsPending] = useDebounce(false, 800);

	const {
		profile: { db },
	} = useProfileControls();
	const sync = useCallback(() => {
		setIsPending(true);
		setIsPending.flush();

		db.sync().finally(() => setIsPending(false));
	}, [db, setIsPending]);

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
							animation: isPending
								? `${styles.spinner} 700ms linear infinite`
								: undefined,
						}}
					>
						<FaArrowsRotate />
					</Box>
				),
				onClick: sync,
			},
			{
				placement: 'start',
				priority: 100000,
			},
		);
	}, [controls, isPending, sync]);
};
